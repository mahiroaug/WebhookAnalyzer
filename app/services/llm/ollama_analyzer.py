"""Ollama による Webhook JSON 分析

US-127: 3 層出力（explanation → field_descriptions → summary）とルールベースサニタイズ
US-129: reference_url がない場合に Web 検索で API ドキュメントを補完
US-134: ストリーミング対応（進捗イベント yield）
"""
import asyncio
import json
import logging
import re
import time
from datetime import datetime
from collections.abc import AsyncGenerator
from dataclasses import dataclass
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    """分析結果（US-127: explanation 追加）"""

    summary: str
    field_descriptions: dict[str, str]
    explanation: str = ""
    failed: bool = False
    error_message: str | None = None


# --- Step 0: エビデンス収集 ---


async def _fetch_url_content(url: str, timeout_sec: float = 5) -> str:
    """reference_url の内容をフェッチ。失敗時は空文字を返す。"""
    try:
        async with httpx.AsyncClient(timeout=timeout_sec, follow_redirects=True) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            text = resp.text
            # 長すぎる場合は先頭 N 文字のみ（LLM トークン制限対策）
            max_chars = 15_000
            if len(text) > max_chars:
                text = text[:max_chars] + "\n...[省略]"
            return text
    except Exception as e:
        logger.debug("URL フェッチ失敗 %s: %s", url, e)
        return ""


def _web_search_sync(query: str, max_results: int = 3) -> list[dict[str, str]]:
    """US-129: Web 検索を同期で実行。失敗時は空リスト。"""
    try:
        from duckduckgo_search import DDGS

        results: list[dict[str, str]] = []
        with DDGS() as ddgs:
            for r in ddgs.text(query, max_results=max_results):
                if isinstance(r, dict) and r.get("href") and r.get("body"):
                    results.append({"url": str(r["href"]), "snippet": str(r.get("body", ""))[:2000]})
        return results
    except Exception as e:
        logger.debug("Web 検索失敗 %s: %s", query, e)
        return []


async def _web_search_for_api_docs(source: str, event_type: str) -> list[dict[str, str]]:
    """US-129: source と event_type から API ドキュメントを検索。タイムアウト時は空リスト。"""
    query = f"{source} {event_type} API documentation"
    try:
        return await asyncio.wait_for(
            asyncio.to_thread(_web_search_sync, query, max_results=3),
            timeout=10.0,
        )
    except asyncio.TimeoutError:
        logger.debug("Web 検索タイムアウト: %s", query)
        return []
    except Exception as e:
        logger.debug("Web 検索失敗: %s", e)
        return []


def _collect_payload_values_ge_n(obj: Any, n: int) -> set[str]:
    """ペイロードから n 文字以上の文字列値を再帰的に収集。"""
    out: set[str] = set()
    if isinstance(obj, str):
        if len(obj) >= n:
            out.add(obj)
        return out
    if isinstance(obj, dict):
        for v in obj.values():
            out.update(_collect_payload_values_ge_n(v, n))
        return out
    if isinstance(obj, list):
        for v in obj:
            out.update(_collect_payload_values_ge_n(v, n))
        return out
    return out


def _sanitize_text(text: str, values_to_remove: set[str]) -> str:
    """values_to_remove に含まれる文字列をテキストから除去。"""
    result = text
    # 長い順に置換（部分一致を避けるため）
    for v in sorted(values_to_remove, key=len, reverse=True):
        if v and v in result:
            result = result.replace(v, "")
    # 連続空白を単一に
    result = re.sub(r"\s+", " ", result).strip()
    return result


def sanitize_for_yaml(payload: dict, summary: str, field_descriptions: dict[str, str]) -> tuple[str, dict[str, str]]:
    """
    ペイロードの具体値（6文字以上）を summary / field_descriptions から除去。
    US-127: ルールベースサニタイズ。
    """
    values = _collect_payload_values_ge_n(payload, 6)
    if not values:
        return (summary, dict(field_descriptions))
    safe_summary = _sanitize_text(summary, values)
    safe_descriptions = {k: _sanitize_text(v, values) for k, v in field_descriptions.items()}
    return (safe_summary, safe_descriptions)


# --- プロンプト定義 ---

_PROMPT_STEP1 = """あなたは Webhook の各フィールドを初心者向けに解説するエキスパートです。

以下の Webhook JSON の各フィールドについて、**具体値**と API リファレンスを根拠に、初心者向けの個別解説を日本語で書いてください。
{user_feedback_section}

{evidence_section}

Webhook JSON:
```json
{payload_json}
```

出力は必ず次の JSON 形式のみで返してください（他に説明文は含めない）:
{{"explanation": "各フィールドの具体値を交えた初心者向けの個別解説を1つのテキストで記述してください。"}}
"""

_PROMPT_STEP2 = """以下の「個別解説」から、**説明文内の具体的な値（ハッシュ・アドレス・ID の実値など）を除いた**汎用的なフィールド説明を導出してください。
**重要**: ペイロードに存在するフィールドはすべて含めてください。除外するのは説明文内の固有値であり、フィールド名自体ではありません。
以下のフィールドは必ずすべて含めてください: {payload_keys}

個別解説:
```
{explanation}
```

出力は必ず次の JSON 形式のみで返してください:
{{"field_descriptions": {{"フィールド名": "汎用的な説明（固有値を含まない）", ...}}}}
"""

_PROMPT_STEP3 = """以下の field_descriptions を 1〜2 文の汎用概要に要約してください。
同 event_type の他の Webhook にも通用する文言にしてください。固有値は含めないでください。

field_descriptions:
```json
{field_descriptions_json}
```

出力は必ず次の JSON 形式のみで返してください:
{{"summary": "1〜2文の汎用概要"}}
"""


def _format_template_context(field_defs: list) -> str:
    """フィールド辞書テンプレートをプロンプト用の文字列に変換する"""
    if not field_defs:
        return ""
    lines = ["以下のサービス別フィールド辞書を参考に、解説に反映してください:"]
    for fd in field_defs:
        line = f"- {fd.path}: {fd.description}"
        if fd.notes:
            line += f"（注意: {fd.notes}）"
        if fd.reference_url:
            line += f" [参照: {fd.reference_url}]"
        lines.append(line)
    return "\n".join(lines)


def _ensure_payload_keys_in_descriptions(
    payload: dict, explanation: str, field_descriptions: dict[str, str]
) -> dict[str, str]:
    """
    US-151: Step 2 で欠落したペイロードのトップレベルキーを補完する。
    explanation から「**key**: 説明」パターンで抽出を試み、なければ「不明」を設定。
    """
    if not isinstance(payload, dict):
        return field_descriptions
    top_keys = list(payload.keys())
    result = dict(field_descriptions)
    for key in top_keys:
        if key in result:
            continue
        # explanation から「**key**: 説明」または「* key: 説明」を検索
        desc = ""
        for pattern in (
            rf"\*\*{re.escape(key)}\*\*[:\s]+([^\n*]+)",
            rf"(?:^|\n)[*\-]\s+{re.escape(key)}[:\s]+([^\n]+)",
        ):
            m = re.search(pattern, explanation)
            if m:
                candidate = m.group(1).strip()
                if len(candidate) > 3 and "0x" not in candidate[:20]:
                    desc = candidate[:200]
                break
        if not desc:
            desc = "不明"
        result[key] = desc
    return result


def _extract_json(content: str) -> dict | None:
    """LLM 出力から JSON を抽出してパース。"""
    if "```json" in content:
        start = content.find("```json") + 7
        end = content.find("```", start)
        content = content[start:end].strip()
    elif "```" in content:
        start = content.find("```") + 3
        end = content.find("```", start)
        content = content[start:end].strip()
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return None


async def _call_ollama(prompt: str, model: str | None = None) -> str | None:
    """Ollama に 1 回チャットして応答テキストを返す。失敗時は None。US-143: model オーバーライド対応。"""
    try:
        import ollama
    except ImportError:
        logger.error("ollama パッケージがインストールされていません")
        return None
    try:
        client = ollama.AsyncClient(host=settings.ollama_host)
        response = await client.chat(
            model=model or settings.ollama_model,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.1},
        )
        msg = response.message if hasattr(response, "message") else None
        if msg is None:
            return None
        raw = msg if isinstance(msg, dict) else {"content": getattr(msg, "content", "")}
        return (raw.get("content") or "").strip()
    except Exception as e:
        logger.warning("Ollama 呼び出し失敗: %s", e, exc_info=True)
        return None


async def analyze_payload_with_ollama(
    payload: dict,
    template_context: list | None = None,
    user_feedback: str | None = None,
    source: str = "",
    event_type: str = "",
    model: str | None = None,
) -> AnalysisResult:
    """
    Ollama で Webhook ペイロードを分析する。
    US-127: 3 回の LLM 呼び出しで explanation → field_descriptions → summary の段階的抽象化。
    失敗時は analysis_failed を返す。
    """
    try:
        import ollama  # noqa: F401
    except ImportError:
        return AnalysisResult(
            summary="",
            field_descriptions={},
            explanation="",
            failed=True,
            error_message="ollama_not_installed",
        )

    payload_str = json.dumps(payload, ensure_ascii=False, indent=2)

    user_feedback_section = ""
    if user_feedback and user_feedback.strip():
        user_feedback_section = (
            "\n**【ユーザーからの改善指示】（必ず反映すること）**:\n"
            + user_feedback.strip()
            + "\n\n"
        )

    # Step 0: エビデンス収集（reference_url のフェッチ + US-129: なければ Web 検索）
    evidence_parts: list[str] = []
    has_reference_urls = False
    if template_context:
        urls = {fd.reference_url for fd in template_context if fd.reference_url}
        has_reference_urls = bool(urls)
        for url in urls:
            content = await _fetch_url_content(url)
            if content:
                evidence_parts.append(f"[参照: {url}]\n{content[:8000]}")

    # US-129: reference_url がなければ source/event_type で Web 検索
    if not has_reference_urls and source and event_type:
        search_results = await _web_search_for_api_docs(source, event_type)
        for r in search_results:
            url = r.get("url", "")
            snippet = r.get("snippet", "")
            if url and snippet:
                evidence_parts.append(f"[検索結果: {url}]\n{snippet}")

    evidence_section = ""
    if evidence_parts:
        evidence_section = "以下の API ドキュメントを参照し、解説の根拠にしてください:\n\n" + "\n\n---\n\n".join(evidence_parts)

    template_section = ""
    if template_context:
        template_section = _format_template_context(template_context) + "\n\n"
    if template_section:
        evidence_section = template_section + evidence_section

    # Step 1: explanation
    prompt1 = _PROMPT_STEP1.format(
        user_feedback_section=user_feedback_section,
        evidence_section=evidence_section or "（参照ドキュメントなし）",
        payload_json=payload_str,
    )
    content1 = await _call_ollama(prompt1, model)
    if not content1:
        return AnalysisResult(
            summary="",
            field_descriptions={},
            explanation="",
            failed=True,
            error_message="step1_empty_response",
        )
    parsed1 = _extract_json(content1)
    if parsed1 is None:
        logger.warning("Step 1 の JSON 解析失敗: %s", content1[:300])
        return AnalysisResult(
            summary="",
            field_descriptions={},
            explanation="",
            failed=True,
            error_message="LLM 出力が JSON ではありません",
        )
    if not isinstance(parsed1, dict):
        logger.warning("Step 1 の応答が dict ではない: %s", content1[:300])
        return AnalysisResult(
            summary="",
            field_descriptions={},
            explanation="",
            failed=True,
            error_message="不正な応答形式",
        )
    explanation = str(parsed1.get("explanation", "")).strip()

    # Step 2: field_descriptions
    payload_keys = list(payload.keys()) if isinstance(payload, dict) else []
    payload_keys_str = ", ".join(f'"{k}"' for k in payload_keys) if payload_keys else "（なし）"
    prompt2 = _PROMPT_STEP2.format(explanation=explanation, payload_keys=payload_keys_str)
    content2 = await _call_ollama(prompt2, model)
    if not content2:
        return AnalysisResult(
            summary="",
            field_descriptions={},
            explanation=explanation,
            failed=True,
            error_message="step2_empty_response",
        )
    parsed2 = _extract_json(content2)
    if not parsed2 or not isinstance(parsed2, dict):
        logger.warning("Step 2 の JSON 解析失敗: %s", content2[:300])
        return AnalysisResult(
            summary="",
            field_descriptions={},
            explanation=explanation,
            failed=True,
            error_message="不正な応答形式",
        )
    field_descriptions = parsed2.get("field_descriptions", {})
    if not isinstance(field_descriptions, dict):
        field_descriptions = {}
    field_descriptions = _ensure_payload_keys_in_descriptions(payload, explanation, field_descriptions)

    # Step 3: summary
    prompt3 = _PROMPT_STEP3.format(
        field_descriptions_json=json.dumps(field_descriptions, ensure_ascii=False, indent=2),
    )
    content3 = await _call_ollama(prompt3, model)
    if not content3:
        return AnalysisResult(
            summary="",
            field_descriptions=field_descriptions,
            explanation=explanation,
            failed=True,
            error_message="step3_empty_response",
        )
    parsed3 = _extract_json(content3)
    if not parsed3 or not isinstance(parsed3, dict):
        logger.warning("Step 3 の JSON 解析失敗: %s", content3[:300])
        return AnalysisResult(
            summary="",
            field_descriptions=field_descriptions,
            explanation=explanation,
            failed=True,
            error_message="不正な応答形式",
        )
    summary = str(parsed3.get("summary", "")).strip()

    # サニタイズ（YAML 用に保存する summary / field_descriptions のみ）
    safe_summary, safe_field_descriptions = sanitize_for_yaml(payload, summary, field_descriptions)

    return AnalysisResult(
        summary=safe_summary,
        field_descriptions=safe_field_descriptions,
        explanation=explanation,
        failed=False,
    )


# --- US-134: ストリーミング版（進捗イベントを yield）---


async def analyze_payload_with_ollama_stream(
    payload: dict,
    template_context: list | None = None,
    user_feedback: str | None = None,
    source: str = "",
    event_type: str = "",
    model: str | None = None,
) -> AsyncGenerator[dict, None]:
    """
    analyze_payload_with_ollama のストリーミング版。
    各ステップで進捗イベントを yield。最後に {"step": "done", "result": {...}} を yield。
    """
    try:
        import ollama  # noqa: F401
    except ImportError:
        yield {"step": "error", "message": "ollama_not_installed", "timestamp": datetime.now().isoformat()}
        yield {"step": "done", "result": {"failed": True, "error_message": "ollama_not_installed"}, "timestamp": datetime.now().isoformat()}
        return

    payload_str = json.dumps(payload, ensure_ascii=False, indent=2)
    user_feedback_section = ""
    if user_feedback and user_feedback.strip():
        user_feedback_section = (
            "\n**【ユーザーからの改善指示】（必ず反映すること）**:\n"
            + user_feedback.strip()
            + "\n\n"
        )

    # Step 0: Evidence
    t0 = time.perf_counter()
    yield {"step": "evidence", "message": "Evidence 収集中...", "timestamp": datetime.now().isoformat()}
    evidence_parts: list[str] = []
    has_reference_urls = False
    if template_context:
        urls = {fd.reference_url for fd in template_context if fd.reference_url}
        has_reference_urls = bool(urls)
        for url in urls:
            content = await _fetch_url_content(url)
            if content:
                evidence_parts.append(f"[参照: {url}]\n{content[:8000]}")
    if not has_reference_urls and source and event_type:
        search_results = await _web_search_for_api_docs(source, event_type)
        for r in search_results:
            url = r.get("url", "")
            snippet = r.get("snippet", "")
            if url and snippet:
                evidence_parts.append(f"[検索結果: {url}]\n{snippet}")
    evidence_section = ""
    if evidence_parts:
        evidence_section = "以下の API ドキュメントを参照し、解説の根拠にしてください:\n\n" + "\n\n---\n\n".join(evidence_parts)
    template_section = ""
    if template_context:
        template_section = _format_template_context(template_context) + "\n\n"
    if template_section:
        evidence_section = template_section + evidence_section
    elapsed0 = (time.perf_counter() - t0) * 1000
    yield {"step": "evidence", "message": f"Evidence 収集完了 ({len(evidence_parts)} 件)", "elapsed_ms": round(elapsed0, 1), "timestamp": datetime.now().isoformat()}

    # Step 1: Explanation
    t1 = time.perf_counter()
    prompt1 = _PROMPT_STEP1.format(
        user_feedback_section=user_feedback_section,
        evidence_section=evidence_section or "（参照ドキュメントなし）",
        payload_json=payload_str,
    )
    yield {"step": "explanation", "message": "Step 1: Explanation 開始", "prompt_preview": prompt1[:200] + "...", "prompt_full": prompt1, "timestamp": datetime.now().isoformat()}
    content1 = await _call_ollama(prompt1, model)
    elapsed1 = (time.perf_counter() - t1) * 1000
    if not content1:
        yield {"step": "explanation", "message": "Step 1 失敗: 空レスポンス", "elapsed_ms": round(elapsed1, 1), "timestamp": datetime.now().isoformat()}
        yield {"step": "done", "result": _result_to_dict(AnalysisResult(summary="", field_descriptions={}, explanation="", failed=True, error_message="step1_empty_response")), "timestamp": datetime.now().isoformat()}
        return
    yield {"step": "explanation", "message": f"Step 1 完了 ({len(content1)} chars)", "response_preview": content1[:300] + "...", "response_full": content1, "elapsed_ms": round(elapsed1, 1), "timestamp": datetime.now().isoformat()}
    parsed1 = _extract_json(content1)
    if parsed1 is None or not isinstance(parsed1, dict):
        yield {"step": "error", "message": "LLM 出力が JSON ではありません", "timestamp": datetime.now().isoformat()}
        yield {"step": "done", "result": _result_to_dict(AnalysisResult(summary="", field_descriptions={}, explanation="", failed=True, error_message="不正な応答形式")), "timestamp": datetime.now().isoformat()}
        return
    explanation = str(parsed1.get("explanation", "")).strip()

    # Step 2: field_descriptions
    t2 = time.perf_counter()
    payload_keys = list(payload.keys()) if isinstance(payload, dict) else []
    payload_keys_str = ", ".join(f'"{k}"' for k in payload_keys) if payload_keys else "（なし）"
    prompt2 = _PROMPT_STEP2.format(explanation=explanation, payload_keys=payload_keys_str)
    yield {"step": "fields", "message": "Step 2: Field Descriptions 開始", "prompt_full": prompt2, "timestamp": datetime.now().isoformat()}
    content2 = await _call_ollama(prompt2, model)
    elapsed2 = (time.perf_counter() - t2) * 1000
    if not content2:
        yield {"step": "fields", "message": "Step 2 失敗", "elapsed_ms": round(elapsed2, 1), "timestamp": datetime.now().isoformat()}
        yield {"step": "done", "result": _result_to_dict(AnalysisResult(summary="", field_descriptions={}, explanation=explanation, failed=True, error_message="step2_empty_response")), "timestamp": datetime.now().isoformat()}
        return
    yield {"step": "fields", "message": f"Step 2 完了", "response_full": content2, "elapsed_ms": round(elapsed2, 1), "timestamp": datetime.now().isoformat()}
    parsed2 = _extract_json(content2)
    if not parsed2 or not isinstance(parsed2, dict):
        yield {"step": "error", "message": "不正な応答形式", "timestamp": datetime.now().isoformat()}
        yield {"step": "done", "result": _result_to_dict(AnalysisResult(summary="", field_descriptions={}, explanation=explanation, failed=True, error_message="不正な応答形式")), "timestamp": datetime.now().isoformat()}
        return
    field_descriptions = parsed2.get("field_descriptions", {})
    if not isinstance(field_descriptions, dict):
        field_descriptions = {}
    field_descriptions = _ensure_payload_keys_in_descriptions(payload, explanation, field_descriptions)

    # Step 3: summary
    t3 = time.perf_counter()
    prompt3 = _PROMPT_STEP3.format(
        field_descriptions_json=json.dumps(field_descriptions, ensure_ascii=False, indent=2),
    )
    yield {"step": "summary", "message": "Step 3: Summary 開始", "prompt_full": prompt3, "timestamp": datetime.now().isoformat()}
    content3 = await _call_ollama(prompt3, model)
    elapsed3 = (time.perf_counter() - t3) * 1000
    if not content3:
        yield {"step": "summary", "message": "Step 3 失敗", "elapsed_ms": round(elapsed3, 1), "timestamp": datetime.now().isoformat()}
        yield {"step": "done", "result": _result_to_dict(AnalysisResult(summary="", field_descriptions=field_descriptions, explanation=explanation, failed=True, error_message="step3_empty_response")), "timestamp": datetime.now().isoformat()}
        return
    yield {"step": "summary", "message": "Step 3 完了", "response_full": content3, "elapsed_ms": round(elapsed3, 1), "timestamp": datetime.now().isoformat()}
    parsed3 = _extract_json(content3)
    if not parsed3 or not isinstance(parsed3, dict):
        yield {"step": "error", "message": "不正な応答形式", "timestamp": datetime.now().isoformat()}
        yield {"step": "done", "result": _result_to_dict(AnalysisResult(summary="", field_descriptions=field_descriptions, explanation=explanation, failed=True, error_message="不正な応答形式")), "timestamp": datetime.now().isoformat()}
        return
    summary = str(parsed3.get("summary", "")).strip()

    # Sanitize
    yield {"step": "sanitize", "message": "サニタイズ実行", "timestamp": datetime.now().isoformat()}
    safe_summary, safe_field_descriptions = sanitize_for_yaml(payload, summary, field_descriptions)
    yield {"step": "sanitize", "message": "サニタイズ完了", "timestamp": datetime.now().isoformat()}

    result = AnalysisResult(
        summary=safe_summary,
        field_descriptions=safe_field_descriptions,
        explanation=explanation,
        failed=False,
    )
    yield {"step": "done", "result": _result_to_dict(result), "timestamp": datetime.now().isoformat()}


def _result_to_dict(r: AnalysisResult) -> dict:
    return {
        "summary": r.summary,
        "field_descriptions": r.field_descriptions,
        "explanation": r.explanation,
        "failed": r.failed,
        "error_message": r.error_message,
    }
