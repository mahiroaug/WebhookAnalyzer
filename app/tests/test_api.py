"""Webhook API の統合テスト"""
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services import field_templates


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
async def test_list_webhooks_payload_search(
    bitgo_transfer_payload: dict,
) -> None:
    """q パラメータで payload 全文検索ができる（US-122）"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        assert post_resp.status_code == 201
        hash_val = bitgo_transfer_payload.get("hash", "")

        resp = await client.get("/api/webhooks", params={"q": hash_val})
        assert resp.status_code == 200
        data = resp.json()
        assert data["total"] >= 1
        assert len(data["items"]) >= 1
        assert data["items"][0]["id"] == post_resp.json()["id"]

        resp2 = await client.get("/api/webhooks", params={"q": "nonexistent_value_xyz"})
        assert resp2.status_code == 200
        assert resp2.json()["total"] == 0
        assert resp2.json()["items"] == []


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
async def test_filter_options_mutual_constraint(
    bitgo_transfer_payload: dict,
    fireblocks_tx_payload: dict,
) -> None:
    """US-175: source/event_type でフィルタ候補が相互連動する"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        await client.post("/api/webhooks/receive", json=fireblocks_tx_payload)

        # 両方未指定 → 全候補
        r0 = await client.get("/api/webhooks/filter-options")
    assert r0.status_code == 200
    d0 = r0.json()
    assert "bitgo" in d0["sources"]
    assert "fireblocks" in d0["sources"]
    assert "transfer" in d0["event_types"]
    assert "transaction.created" in d0["event_types"]

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        # source=bitgo → event_types は bitgo に存在するもののみ
        r1 = await client.get("/api/webhooks/filter-options", params={"source": "bitgo"})
    assert r1.status_code == 200
    assert "transfer" in r1.json()["event_types"]
    assert "transaction.created" not in r1.json()["event_types"]

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        # event_type=transfer → sources は transfer を持つもののみ
        r2 = await client.get("/api/webhooks/filter-options", params={"event_type": "transfer"})
    assert r2.status_code == 200
    assert "bitgo" in r2.json()["sources"]
    assert "fireblocks" not in r2.json()["sources"]


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


@pytest.mark.asyncio
async def test_receive_webhook_stores_http_metadata(
    bitgo_transfer_payload: dict,
) -> None:
    """受信時に HTTP メソッド・ヘッダー・IP が保存される（US-116）"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        post_resp = await client.post(
            "/api/webhooks/receive",
            json=bitgo_transfer_payload,
            headers={"X-Custom-Header": "test-value"},
        )
        assert post_resp.status_code == 201
        webhook_id = post_resp.json()["id"]
        detail = await client.get(f"/api/webhooks/{webhook_id}")

    assert detail.status_code == 200
    data = detail.json()
    assert "http_method" in data
    assert data["http_method"] == "POST"
    assert "remote_ip" in data
    assert "request_headers" in data
    assert isinstance(data["request_headers"], dict)


@pytest.mark.asyncio
async def test_list_webhooks_includes_http_metadata(
    bitgo_transfer_payload: dict,
) -> None:
    """一覧 API に http_method と remote_ip が含まれる（US-116）"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        resp = await client.get("/api/webhooks")

    assert resp.status_code == 200
    items = resp.json()["items"]
    assert len(items) >= 1
    assert "http_method" in items[0]
    assert "remote_ip" in items[0]


@pytest.mark.asyncio
async def test_replay_invalid_url_returns_400(
    bitgo_transfer_payload: dict,
) -> None:
    """US-145: 無効な target_url で 400"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        list_resp = await client.get("/api/webhooks")
        webhook_id = list_resp.json()["items"][0]["id"]
        resp = await client.post(
            f"/api/webhooks/{webhook_id}/replay",
            json={"target_url": "not-a-valid-url"},
        )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_replay_webhook_success(
    bitgo_transfer_payload: dict,
) -> None:
    """US-145: 再送 API がモックで成功を返す"""
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    async def mock_post(*args, **kwargs):
        return mock_resp

    with patch("httpx.AsyncClient") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.post = AsyncMock(side_effect=mock_post)
        mock_client.__aenter__ = AsyncMock(return_value=mock_client)
        mock_client.__aexit__ = AsyncMock(return_value=None)
        mock_client_cls.return_value = mock_client

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
            list_resp = await client.get("/api/webhooks")
            webhook_id = list_resp.json()["items"][0]["id"]
            resp = await client.post(
                f"/api/webhooks/{webhook_id}/replay",
                json={"target_url": "https://example.com/webhook"},
            )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["status_code"] == 200
    assert "elapsed_ms" in data


@pytest.mark.asyncio
async def test_mark_webhook_read(
    bitgo_transfer_payload: dict,
) -> None:
    """US-160: PATCH /read で既読にできる"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        webhook_id = post_resp.json()["id"]
        list_resp = await client.get("/api/webhooks")
        items = list_resp.json()["items"]
        before = next((i for i in items if i["id"] == webhook_id), {})
        assert before.get("is_read") is False
        patch_resp = await client.patch(f"/api/webhooks/{webhook_id}/read")
    assert patch_resp.status_code == 204
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        list_resp = await client.get("/api/webhooks")
        items = list_resp.json()["items"]
        after = next((i for i in items if i["id"] == webhook_id), {})
    assert after.get("is_read") is True


@pytest.mark.asyncio
async def test_export_webhook_pdf(
    bitgo_transfer_payload: dict,
) -> None:
    """US-166: PDF エクスポート API が PDF を返す"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        webhook_id = post_resp.json()["id"]
        resp = await client.get(f"/api/webhooks/{webhook_id}/export/pdf")
    assert resp.status_code == 200
    assert resp.headers.get("content-type", "").startswith("application/pdf")
    assert "attachment" in resp.headers.get("content-disposition", "").lower()
    assert len(resp.content) > 500


@pytest.mark.asyncio
async def test_export_webhook_pdf_fallback_to_definition_file(
    bitgo_transfer_payload: dict,
    tmp_path: Path,
) -> None:
    """US-171: DB に分析がなく定義ファイルがあれば PDF に反映される"""
    (tmp_path / "bitgo").mkdir(parents=True, exist_ok=True)
    yaml_content = """
summary: PDF definition summary
fields:
  - path: hash
    description: Transaction hash from definition
  - path: type
    description: Event type from definition
"""
    (tmp_path / "bitgo" / "transfer.yaml").write_text(yaml_content.strip())

    with patch.object(field_templates, "_DEFINITIONS_DIR", tmp_path):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
            webhook_id = post_resp.json()["id"]
            resp = await client.get(f"/api/webhooks/{webhook_id}/export/pdf")

    assert resp.status_code == 200
    assert resp.headers.get("content-type", "").startswith("application/pdf")
    # 定義ファイル由来の分析が含まれるため、「Not analyzed」のみの PDF より大きくなる
    assert len(resp.content) > 2760


@pytest.mark.asyncio
async def test_mark_all_webhooks_read(
    bitgo_transfer_payload: dict,
) -> None:
    """US-167: POST /api/webhooks/mark-all-read でフィルタ一致分を既読にする"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
        resp = await client.post("/api/webhooks/mark-all-read")
    assert resp.status_code == 200
    data = resp.json()
    assert "marked_count" in data
    assert isinstance(data["marked_count"], int)


@pytest.mark.asyncio
async def test_health_services_returns_structure() -> None:
    """US-162/US-177: GET /api/health/services が期待構造を返す"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as client:
        resp = await client.get("/api/health/services")
    assert resp.status_code == 200
    data = resp.json()
    assert "public_url" in data
    assert data["public_url"]["status"] in ("live", "offline")
    assert "local_api" in data
    assert data["local_api"]["status"] == "live"
    assert "vite" in data
    assert data["vite"]["status"] in ("live", "offline")
    assert data["vite"]["url"] == "http://localhost:5173"
    assert "postgresql" in data
    assert data["postgresql"]["status"] in ("live", "offline")
    assert data["postgresql"]["url"] == "http://localhost:5432"
    assert "ollama" in data
    assert data["ollama"]["status"] in ("live", "offline")
    assert data["ollama"]["url"] == "http://localhost:11434"
