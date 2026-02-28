"""定義ファイル API のテスト（US-141）"""
import pytest
from pathlib import Path
from unittest.mock import patch

from httpx import ASGITransport, AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_definition_status_exists_writable(tmp_path: Path) -> None:
    """定義ファイルが存在し書き込み可能な場合、exists=True, writable=True"""
    from app.services import field_templates

    (tmp_path / "bitgo").mkdir(parents=True)
    (tmp_path / "bitgo" / "transfer.yaml").write_text("""summary: test
fields:
- path: type
  description: Webhook type
""")

    with patch.object(field_templates, "_DEFINITIONS_DIR", tmp_path):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.get("/api/definitions/bitgo/transfer")
    assert resp.status_code == 200
    data = resp.json()
    assert data["exists"] is True
    assert data["writable"] is True


@pytest.mark.asyncio
async def test_definition_status_not_exists(tmp_path: Path) -> None:
    """定義ファイルが存在しない場合、exists=False, writable=False"""
    from app.services import field_templates

    with patch.object(field_templates, "_DEFINITIONS_DIR", tmp_path):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.get("/api/definitions/unknown/source")
    assert resp.status_code == 200
    data = resp.json()
    assert data["exists"] is False
    assert data["writable"] is False


@pytest.mark.asyncio
async def test_patch_field_description_success(tmp_path: Path) -> None:
    """PATCH でフィールド description を更新できる"""
    from app.services import field_templates

    (tmp_path / "bitgo").mkdir(parents=True)
    (tmp_path / "bitgo" / "transfer.yaml").write_text("""summary: test
fields:
- path: type
  description: Webhook type
- path: coin
  description: Asset type
""")

    with patch.object(field_templates, "_DEFINITIONS_DIR", tmp_path):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.patch(
                "/api/definitions/bitgo/transfer/fields",
                json={"path": "type", "description": "Updated description"},
            )
    assert resp.status_code == 200
    assert resp.json()["ok"] is True

    content = (tmp_path / "bitgo" / "transfer.yaml").read_text(encoding="utf-8")
    assert "Updated description" in content
    assert "Webhook type" not in content


@pytest.mark.asyncio
async def test_patch_field_not_found_returns_404(tmp_path: Path) -> None:
    """存在しないパスで PATCH すると 404"""
    from app.services import field_templates

    (tmp_path / "bitgo").mkdir(parents=True)
    (tmp_path / "bitgo" / "transfer.yaml").write_text("""summary: test
fields:
- path: type
  description: x
""")

    with patch.object(field_templates, "_DEFINITIONS_DIR", tmp_path):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.patch(
                "/api/definitions/bitgo/transfer/fields",
                json={"path": "nonexistent", "description": "y"},
            )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_patch_definition_not_found_returns_404(tmp_path: Path) -> None:
    """定義ファイルが存在しない場合 PATCH で 404"""
    from app.services import field_templates

    with patch.object(field_templates, "_DEFINITIONS_DIR", tmp_path):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            resp = await client.patch(
                "/api/definitions/unknown/type/fields",
                json={"path": "x", "description": "y"},
            )
    assert resp.status_code == 404
