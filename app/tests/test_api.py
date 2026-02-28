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
async def test_get_adjacent_webhooks(
    bitgo_transfer_payload: dict,
) -> None:
    """前後 Webhook の ID が取得できる（US-110）"""
    import asyncio

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        ids = []
        for _ in range(3):
            r = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
            assert r.status_code == 201
            ids.append(r.json()["id"])
            await asyncio.sleep(0.01)  # received_at の順序を保証

        # ids[0]=最古(先に作成) ids[2]=最新(後に作成)。中間は [1]
        mid_id = ids[1]
        resp = await client.get(f"/api/webhooks/{mid_id}/adjacent")
    assert resp.status_code == 200
    data = resp.json()
    assert "prev_id" in data
    assert "next_id" in data
    assert data["prev_id"] == ids[2]  # より新しい（後に作成）
    assert data["next_id"] == ids[0]  # より古い（先に作成）


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


@pytest.mark.asyncio
async def test_schema_drift_detected_on_receive(
    bitgo_pending_approval_payload: dict,
) -> None:
    """同 event_type の2件目で構造が異なると schema_drift が検知される"""
    payload1 = dict(bitgo_pending_approval_payload)
    payload2 = dict(bitgo_pending_approval_payload)
    payload2["extraField"] = "unknown"  # 追加フィールド
    payload2.pop("walletId", None)  # 削除（存在する場合）

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        r1 = await client.post("/api/webhooks/receive", json=payload1)
        assert r1.status_code == 201
        r2 = await client.post("/api/webhooks/receive", json=payload2)
        assert r2.status_code == 201

        # 2件目の詳細に schema_drift が入っている
        detail = await client.get(f"/api/webhooks/{r2.json()['id']}")
    assert detail.status_code == 200
    data = detail.json()
    assert "schema_drift" in data
    drift = data["schema_drift"]
    assert drift is not None
    assert drift.get("has_drift") is True
    assert "extraField" in drift.get("added", [])


@pytest.mark.asyncio
async def test_receive_webhook_assigns_sequence_index(
    bitgo_transfer_payload: dict,
) -> None:
    """受信時に sequence_index が自動付与される（US-113）"""
    import asyncio

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        ids = []
        for _ in range(3):
            r = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
            assert r.status_code == 201
            ids.append(r.json()["id"])
            await asyncio.sleep(0.01)

        resp1 = await client.get(f"/api/webhooks/{ids[0]}")
        resp2 = await client.get(f"/api/webhooks/{ids[1]}")
        resp3 = await client.get(f"/api/webhooks/{ids[2]}")

    d1 = resp1.json()
    d2 = resp2.json()
    d3 = resp3.json()
    assert "sequence_index" in d1
    assert "sequence_index" in d2
    assert "sequence_index" in d3
    assert d1["sequence_index"] < d2["sequence_index"] < d3["sequence_index"]


@pytest.mark.asyncio
async def test_list_webhooks_includes_sequence_index(
    bitgo_transfer_payload: dict,
) -> None:
    """一覧 API に sequence_index が含まれる（US-113）"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        resp = await client.get("/api/webhooks")
    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 1
    assert "sequence_index" in items[0]
    assert isinstance(items[0]["sequence_index"], int)
