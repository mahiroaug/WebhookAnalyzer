"""Webhook API の統合テスト"""
import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.fixture
def anyio_backend() -> str:
    return "asyncio"


@pytest.mark.asyncio
async def test_receive_webhook_saves_and_returns_classification(
    bitgo_transfer_payload: dict,
) -> None:
    """POST /api/webhooks/receive で受信し、分類結果を返す"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["source"] == "bitgo"
    assert data["event_type"] == "transfer"
    assert data["group_key"] == "bitgo:transfer"


@pytest.mark.asyncio
async def test_list_webhooks_returns_received(
    bitgo_transfer_payload: dict,
) -> None:
    """受信後に一覧で取得できる"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        resp = await client.get("/api/webhooks")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert isinstance(data["items"], list)
    assert len(data["items"]) >= 1
    assert data["items"][0]["source"] == "bitgo"


@pytest.mark.asyncio
async def test_get_webhook_detail_includes_payload(
    bitgo_transfer_payload: dict,
) -> None:
    """詳細取得で payload が含まれる"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        webhook_id = post_resp.json()["id"]
        resp = await client.get(f"/api/webhooks/{webhook_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["payload"] == bitgo_transfer_payload


@pytest.mark.asyncio
async def test_list_webhooks_pagination(
    bitgo_transfer_payload: dict,
    fireblocks_tx_payload: dict,
) -> None:
    """100件以上で初期表示は1ページ分のみ取得される"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        # 複数件投入（テストDBの状態によるが limit/offset の挙動を検証）
        for _ in range(3):
            await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        resp = await client.get("/api/webhooks?limit=2&offset=0")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert len(data["items"]) <= 2
    assert data["total"] >= 3


@pytest.mark.asyncio
async def test_stats_reflects_received_webhooks(
    bitgo_transfer_payload: dict,
    fireblocks_tx_payload: dict,
) -> None:
    """統計 API が受信件数を反映する"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        await client.post("/api/webhooks/receive", json=fireblocks_tx_payload)
        resp = await client.get("/api/webhooks/stats")
    assert resp.status_code == 200
    data = resp.json()
    assert "by_source" in data
    assert "by_event_type" in data
    assert data["by_source"].get("bitgo", 0) >= 1
    assert data["by_source"].get("fireblocks", 0) >= 1


@pytest.mark.asyncio
async def test_field_templates_fireblocks_returns_template() -> None:
    """Fireblocks transaction.created のフィールド辞書テンプレートが取得できる"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        resp = await client.get(
            "/api/webhooks/field-templates",
            params={"source": "fireblocks", "event_type": "transaction.created"},
        )
    assert resp.status_code == 200
    data = resp.json()
    assert data["source"] == "fireblocks"
    assert data["event_type"] == "transaction.created"
    assert "fields" in data
    assert len(data["fields"]) >= 1
    paths = [f["path"] for f in data["fields"]]
    assert "data.status" in paths
    assert "data.id" in paths


@pytest.mark.asyncio
async def test_field_templates_unknown_returns_404() -> None:
    """未対応の source/event_type は 404"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        resp = await client.get(
            "/api/webhooks/field-templates",
            params={"source": "unknown", "event_type": "foo"},
        )
    assert resp.status_code == 404
