"""Ollama による Webhook JSON 分析"""
import json
import logging
from dataclasses import dataclass

from app.config import settings

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    """分析結果"""

    summary: str
    field_descriptions: dict[str, str]
    failed: bool = False
    error_message: str | None = None


# 期待する出力JSONスキーマを固定（決定性のため）
_EXPECTED_KEYS = {"summary", "field_descriptions"}

_PROMPT_TEMPLATE = """以下の Webhook JSON の各フィールドを日本語で簡潔に説明し、
全体の要約を書いてください。
出力は必ず次のJSON形式のみで返してください（他に説明文は含めない）:
{"summary": "全体の要約（1〜2文）", "field_descriptions": {"フィールド名": "説明", ...}}

Webhook JSON:
```json
{payload_json}
```
"""


async def analyze_payload_with_ollama(payload: dict) -> AnalysisResult:
    """
    Ollama で Webhook ペイロードを分析する。
    失敗時は analysis_failed を返す。
    """
    try:
        import ollama
    except ImportError:
        logger.error("ollama パッケージがインストールされていません")
        return AnalysisResult(
            summary="",
            field_descriptions={},
            failed=True,
            error_message="ollama_not_installed",
        )

    payload_str = json.dumps(payload, ensure_ascii=False, indent=2)
    prompt = _PROMPT_TEMPLATE.format(payload_json=payload_str)

    try:
        client = ollama.AsyncClient(host=settings.ollama_host)
        response = await client.chat(
            model=settings.ollama_model,
            messages=[{"role": "user", "content": prompt}],
            options={"temperature": 0.1},  # 出力の揺らぎを抑える
        )
    except Exception as e:
        logger.warning("Ollama 呼び出し失敗: %s", e, exc_info=True)
        return AnalysisResult(
            summary="",
            field_descriptions={},
            failed=True,
            error_message=str(e)[:200],
        )

    content = (response.message or {}).get("content", "").strip()
    if not content:
        return AnalysisResult(
            summary="",
            field_descriptions={},
            failed=True,
            error_message="empty_response",
        )

    # JSON ブロックを抽出（```json ... ``` があればその中身を使う）
    if "```json" in content:
        start = content.find("```json") + 7
        end = content.find("```", start)
        content = content[start:end].strip()
    elif "```" in content:
        start = content.find("```") + 3
        end = content.find("```", start)
        content = content[start:end].strip()

    try:
        parsed = json.loads(content)
    except json.JSONDecodeError as e:
        logger.warning("LLM 出力の JSON 解析失敗: %s", e)
        return AnalysisResult(
            summary="",
            field_descriptions={},
            failed=True,
            error_message="invalid_json",
        )

    summary = parsed.get("summary", "")
    field_descriptions = parsed.get("field_descriptions", {})
    if not isinstance(field_descriptions, dict):
        field_descriptions = {}

    return AnalysisResult(
        summary=summary,
        field_descriptions=field_descriptions,
        failed=False,
    )
