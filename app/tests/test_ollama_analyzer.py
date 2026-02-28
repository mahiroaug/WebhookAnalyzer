"""US-121: AI 分析の JSON パース堅牢化の単体テスト
US-127: 3 層出力・サニタイズの単体テスト"""
import ollama  # noqa: F401 - patch のためモジュールを事前ロード
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.services.llm.ollama_analyzer import (
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
    """LLM が summary のみ（field_descriptions なし）を返すと正常処理される"""
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
    assert result.field_descriptions == {}
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


def test_sanitize_for_yaml_removes_payload_values() -> None:
    """US-127: ペイロード値（6文字以上）が summary/field_descriptions から除去される"""
    payload = {"txHash": "0x1234567890abcdef", "amount": "100"}
    summary = "トランザクション 0x1234567890abcdef が完了しました。"
    field_descriptions = {"txHash": "ハッシュ 0x1234567890abcdef で検索"}
    safe_summary, safe_descriptions = sanitize_for_yaml(payload, summary, field_descriptions)
    assert "0x1234567890abcdef" not in safe_summary
    assert "0x1234567890abcdef" not in safe_descriptions["txHash"]
