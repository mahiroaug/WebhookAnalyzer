"""US-146: 異常検知ルール API のテスト"""
import json
import pytest
from pathlib import Path
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_list_rules_empty(tmp_path: Path) -> None:
    """初回は空リスト"""
    path = tmp_path / "alert_rules.json"
    path.write_text("[]")
    with patch("app.services.alert_rules._RULES_PATH", path):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.get("/api/alert-rules")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_create_and_list_rule(tmp_path: Path) -> None:
    """ルールを追加して一覧で取得"""
    path = tmp_path / "alert_rules.json"
    path.write_text("[]")
    with patch("app.services.alert_rules._RULES_PATH", path):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.post(
                "/api/alert-rules",
                json={"name": "高額送金", "path": "data.amount", "op": ">", "value": 1000000},
            )
        assert resp.status_code == 201
        data = resp.json()
        assert data["name"] == "高額送金"
        assert "id" in data

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp2 = await client.get("/api/alert-rules")
    assert resp2.status_code == 200
    assert len(resp2.json()) >= 1


@pytest.mark.asyncio
async def test_webhook_list_includes_matched_rules(tmp_path: Path) -> None:
    """一覧に matched_rules が含まれる"""
    path = tmp_path / "alert_rules.json"
    path.write_text(json.dumps([{"id": "r1", "name": "テスト", "path": "type", "op": "==", "value": "transfer"}]))
    with patch("app.services.alert_rules._RULES_PATH", path):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            post_resp = await client.post("/api/webhooks/receive", json={"type": "transfer", "coin": "btc"})
            webhook_id = post_resp.json()["id"]
            list_resp = await client.get("/api/webhooks")
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    wh = next((w for w in items if w["id"] == webhook_id), None)
    assert wh is not None
    assert "matched_rules" in wh
    assert len(wh["matched_rules"]) == 1
    assert wh["matched_rules"][0]["name"] == "テスト"
