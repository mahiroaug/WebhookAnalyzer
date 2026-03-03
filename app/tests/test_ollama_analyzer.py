"""US-121: AI 分析の JSON パース堅牢化の単体テスト
US-127: 3 層出力・サニタイズの単体テスト"""
import ollama  # noqa: F401 - patch のためモジュールを事前ロード
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.llm.ollama_analyzer import (
    _ensure_payload_keys_in_descriptions,
    _extract_json,
    analyze_payload_with_ollama,
    sanitize_for_yaml,
)


@pytest.mark.asyncio
async def test_plain_text_response_returns_json_error() -> None:
    """LLM が JSON でなくプレーンテキストを返すと「LLM 出力が JSON ではありません」"""
    mock_response = type("R", (), {
        "message": type("M", (), {"content": "これはプレーンテキストです。JSONではありません。"})(),
    })()

    mock_client = MagicMock()
    mock_client.chat = AsyncMock(return_value=mock_response)
    with patch("ollama.AsyncClient", return_value=mock_client):
        result = await analyze_payload_with_ollama({"foo": "bar"})

    assert result.failed is True
    assert result.error_message == "LLM 出力が JSON ではありません"
    assert result.summary == ""
    assert result.field_descriptions == {}


@pytest.mark.asyncio
async def test_summary_only_response_succeeds() -> None:
    """LLM が summary のみ（field_descriptions なし）を返すと正常処理される（US-151: 欠落キーは補完）"""
    mock_response = type("R", (), {
        "message": type("M", (), {
            "content": '{"summary": "トランザクションの要約です。"}',
        })(),
    })()

    mock_client = MagicMock()
    mock_client.chat = AsyncMock(return_value=mock_response)
    with patch("ollama.AsyncClient", return_value=mock_client):
        result = await analyze_payload_with_ollama({"foo": "bar"})

    assert result.failed is False
    assert result.summary == "トランザクションの要約です。"
    # US-151: Step 2 で field_descriptions が空でもペイロードキーは補完される
    assert "foo" in result.field_descriptions
    assert result.error_message is None


@pytest.mark.asyncio
async def test_parsed_not_dict_returns_invalid_format() -> None:
    """parsed が dict でない（リスト等）だと「不正な応答形式」"""
    mock_response = type("R", (), {
        "message": type("M", (), {
            "content": '["array", "response"]',
        })(),
    })()

    mock_client = MagicMock()
    mock_client.chat = AsyncMock(return_value=mock_response)
    with patch("ollama.AsyncClient", return_value=mock_client):
        result = await analyze_payload_with_ollama({"foo": "bar"})

    assert result.failed is True
    assert result.error_message == "不正な応答形式"
    assert result.summary == ""
    assert result.field_descriptions == {}


@pytest.mark.asyncio
async def test_parsed_string_returns_invalid_format() -> None:
    """parsed が文字列だと「不正な応答形式」"""
    mock_response = type("R", (), {
        "message": type("M", (), {
            "content": '"just a string"',
        })(),
    })()

    mock_client = MagicMock()
    mock_client.chat = AsyncMock(return_value=mock_response)
    with patch("ollama.AsyncClient", return_value=mock_client):
        result = await analyze_payload_with_ollama({"foo": "bar"})

    assert result.failed is True
    assert result.error_message == "不正な応答形式"


def test_ensure_payload_keys_complements_missing_hash() -> None:
    """US-151: Step 2 で hash が欠落していてもフォールバックで補完される"""
    payload = {"hash": "0xabc123", "coin": "tpolygon", "type": "transfer"}
    explanation = "**hash**: 送金トランザクションのハッシュ値です。トランザクションを識別します。\n**coin**: トークン種別。"
    field_descriptions = {"coin": "トークン種別", "type": "送金の種類"}  # hash が欠落
    result = _ensure_payload_keys_in_descriptions(payload, explanation, field_descriptions)
    assert "hash" in result
    assert "送金トランザクション" in result["hash"] or result["hash"] == "不明"
    assert result["coin"] == "トークン種別"
    assert result["type"] == "送金の種類"


def test_ensure_payload_keys_uses_fallback_when_no_extraction() -> None:
    """US-151: explanation にキーがなければ「不明」で補完"""
    payload = {"hash": "0x123", "foo": "bar"}
    explanation = "他のフィールドの説明"
    field_descriptions = {}
    result = _ensure_payload_keys_in_descriptions(payload, explanation, field_descriptions)
    assert result["hash"] == "不明"
    assert result["foo"] == "不明"


def test_sanitize_for_yaml_removes_payload_values() -> None:
    """US-127: ペイロード値（6文字以上）が summary/field_descriptions から除去される"""
    payload = {"txHash": "0x1234567890abcdef", "amount": "100"}
    summary = "トランザクション 0x1234567890abcdef が完了しました。"
    field_descriptions = {"txHash": "ハッシュ 0x1234567890abcdef で検索"}
    safe_summary, safe_descriptions = sanitize_for_yaml(payload, summary, field_descriptions)
    assert "0x1234567890abcdef" not in safe_summary
    assert "0x1234567890abcdef" not in safe_descriptions["txHash"]


def test_extract_json_repairs_truncated_step1() -> None:
    """US-186: トークン上限で途中切断された Step 1 の JSON を閉じブレース補完で修復"""
    truncated = '{"explanation": "フィールドAはxxx。フィールドBはyyy。フィールドCは'
    result = _extract_json(truncated)
    assert result is not None
    assert isinstance(result, dict)
    assert "explanation" in result
    assert "フィールドAはxxx" in result["explanation"]


def test_extract_json_repairs_truncated_field_descriptions() -> None:
    """US-186: 途中切断された field_descriptions を修復"""
    truncated = '{"field_descriptions": {"hash": "ハッシュ値", "amount": "金額'
    result = _extract_json(truncated)
    assert result is not None
    assert result.get("field_descriptions", {}).get("hash") == "ハッシュ値"


def test_extract_json_repair_failure_returns_none() -> None:
    """US-186: 修復も失敗した場合は None（従来のフォールバック維持）"""
    garbage = "this is not json at all {{"
    assert _extract_json(garbage) is None
