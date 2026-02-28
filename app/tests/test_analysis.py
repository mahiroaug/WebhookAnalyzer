"""AI 分析 API のテスト（モック使用で決定性を担保）"""
import pytest
from httpx import ASGITransport, AsyncClient
from unittest.mock import AsyncMock, patch

from app.main import app


@pytest.fixture
def bitgo_transfer_payload() -> dict:
    """BitGo transfer サンプル"""
    return {
        "hash": "0x7fff",
        "type": "transfer",
        "coin": "tpolygon",
        "state": "confirmed",
    }


@pytest.mark.asyncio
async def test_analyze_success_returns_analysis(
    bitgo_transfer_payload: dict,
) -> None:
    """分析成功時に summary と field_descriptions を返す"""
    mock_result = type("R", (), {
        "summary": "BitGoの送金確認Webhookです。",
        "field_descriptions": {"hash": "トランザクションハッシュ", "type": "イベント種別"},
        "failed": False,
        "error_message": None,
    })()

    with patch(
        "app.routers.analysis.analyze_payload_with_ollama",
        new_callable=AsyncMock,
        return_value=mock_result,
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
            webhook_id = post_resp.json()["id"]
            analyze_resp = await client.post(f"/api/webhooks/{webhook_id}/analyze")

    assert analyze_resp.status_code == 200
    data = analyze_resp.json()
    assert data["summary"] == "BitGoの送金確認Webhookです。"
    assert "field_descriptions" in data
    assert data["field_descriptions"].get("hash") == "トランザクションハッシュ"


@pytest.mark.asyncio
async def test_analyze_failure_saves_fallback(
    bitgo_transfer_payload: dict,
) -> None:
    """Ollama 失敗時にフォールバック記録を保存する"""
    mock_result = type("R", (), {
        "summary": "",
        "field_descriptions": {},
        "failed": True,
        "error_message": "connection_refused",
    })()

    with patch(
        "app.routers.analysis.analyze_payload_with_ollama",
        new_callable=AsyncMock,
        return_value=mock_result,
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
            webhook_id = post_resp.json()["id"]
            analyze_resp = await client.post(f"/api/webhooks/{webhook_id}/analyze")

    assert analyze_resp.status_code == 200
    data = analyze_resp.json()
    assert "connection_refused" in (data.get("summary") or "")
    assert data.get("field_descriptions") == {}


@pytest.mark.asyncio
async def test_get_analysis_after_analyze(
    bitgo_transfer_payload: dict,
) -> None:
    """分析実行後、GET で同じ結果を取得できる"""
    mock_result = type("R", (), {
        "summary": "要約テキスト",
        "field_descriptions": {"a": "説明A"},
        "failed": False,
        "error_message": None,
    })()

    with patch(
        "app.routers.analysis.analyze_payload_with_ollama",
        new_callable=AsyncMock,
        return_value=mock_result,
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
            webhook_id = post_resp.json()["id"]
            await client.post(f"/api/webhooks/{webhook_id}/analyze")
            get_resp = await client.get(f"/api/webhooks/{webhook_id}/analysis")

    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["summary"] == "要約テキスト"
    assert data["field_descriptions"]["a"] == "説明A"


@pytest.mark.asyncio
async def test_get_analysis_not_found_returns_404() -> None:
    """分析未実行の Webhook で 404 を返す"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        resp = await client.get(
            "/api/webhooks/00000000-0000-0000-0000-000000000001/analysis"
        )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_analyze_ollama_exception_returns_200_with_failure(
    bitgo_transfer_payload: dict,
) -> None:
    """Ollama が例外を投げても 500 にならず、失敗記録が返る（US-114）"""
    with patch(
        "app.routers.analysis.analyze_payload_with_ollama",
        new_callable=AsyncMock,
        side_effect=ConnectionError("Connection refused"),
    ):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
            webhook_id = post_resp.json()["id"]
            analyze_resp = await client.post(f"/api/webhooks/{webhook_id}/analyze")

    assert analyze_resp.status_code == 200
    data = analyze_resp.json()
    assert "[分析失敗]" in (data.get("summary") or "")


@pytest.mark.asyncio
async def test_analyze_not_found_webhook_returns_404() -> None:
    """存在しない Webhook ID で分析を実行すると 404（US-114）"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        resp = await client.post(
            "/api/webhooks/00000000-0000-0000-0000-000000000099/analyze"
        )
    assert resp.status_code == 404
