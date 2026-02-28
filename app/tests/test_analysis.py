"""AI 分析 API のテスト（モック使用で決定性を担保）"""
import json
import pytest
from pathlib import Path

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
        "explanation": "個別解説テキスト",
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
        "explanation": "",
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
        "explanation": "個別解説",
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
async def test_analyze_success_writes_yaml(tmp_path: Path) -> None:
    """分析成功時に definitions/ に YAML が書き出される（US-125）"""
    from app.services import field_templates

    mock_result = type("R", (), {
        "summary": "テスト要約",
        "field_descriptions": {"newField": "新規AIフィールドの説明"},
        "explanation": "個別解説",
        "failed": False,
        "error_message": None,
    })()

    with patch.object(field_templates, "_DEFINITIONS_DIR", tmp_path):
        with patch(
            "app.routers.analysis.analyze_payload_with_ollama",
            new_callable=AsyncMock,
            return_value=mock_result,
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                post_resp = await client.post(
                    "/api/webhooks/receive",
                    json={"hash": "0xabc", "type": "transfer", "coin": "tpolygon", "state": "confirmed"},
                )
                webhook_id = post_resp.json()["id"]
                analyze_resp = await client.post(f"/api/webhooks/{webhook_id}/analyze")

    assert analyze_resp.status_code == 200
    yaml_path = tmp_path / "bitgo" / "transfer.yaml"
    assert yaml_path.exists()
    import yaml
    with open(yaml_path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    assert data.get("summary") == "テスト要約"
    paths = [f["path"] for f in data.get("fields", [])]
    assert "newField" in paths
    ai_fields = [f for f in data.get("fields", []) if f.get("ai_generated")]
    assert any(f["path"] == "newField" for f in ai_fields)


@pytest.mark.asyncio
async def test_get_analysis_fallback_to_definition_file(tmp_path: Path) -> None:
    """DB に分析がなく定義ファイルがあれば定義ファイルから返す（US-126）"""
    from app.services import field_templates

    (tmp_path / "bitgo").mkdir(parents=True, exist_ok=True)
    yaml_content = """
summary: 定義ファイルの要約
fields:
  - path: hash
    description: トランザクションハッシュ
  - path: type
    description: イベント種別
"""
    (tmp_path / "bitgo" / "transfer.yaml").write_text(yaml_content.strip())

    with patch.object(field_templates, "_DEFINITIONS_DIR", tmp_path):
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            post_resp = await client.post(
                "/api/webhooks/receive",
                json={"hash": "0xabc", "type": "transfer", "coin": "tpolygon", "state": "confirmed"},
            )
            webhook_id = post_resp.json()["id"]
            get_resp = await client.get(f"/api/webhooks/{webhook_id}/analysis")

    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["summary"] == "定義ファイルの要約"
    assert data["field_descriptions"]["hash"] == "トランザクションハッシュ"
    assert data["from_definition_file"] is True


@pytest.mark.asyncio
async def test_analyze_with_user_feedback_passes_to_analyzer(
    bitgo_transfer_payload: dict,
) -> None:
    """US-128: user_feedback を渡すと analyze に渡される"""
    mock_result = type("R", (), {
        "summary": "フィードバック反映済み",
        "field_descriptions": {},
        "explanation": "",
        "failed": False,
        "error_message": None,
    })()

    with patch(
        "app.routers.analysis.analyze_payload_with_ollama",
        new_callable=AsyncMock,
        return_value=mock_result,
    ) as mock_analyze:
        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://test",
        ) as client:
            post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
            webhook_id = post_resp.json()["id"]
            await client.post(
                f"/api/webhooks/{webhook_id}/analyze",
                json={"user_feedback": "ハッシュ値を含めないこと"},
            )

        mock_analyze.assert_called_once()
        call_kwargs = mock_analyze.call_args[1]
        assert call_kwargs.get("user_feedback") == "ハッシュ値を含めないこと"


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


@pytest.mark.asyncio
async def test_analyze_stream_returns_sse_events(
    bitgo_transfer_payload: dict,
    tmp_path: Path,
) -> None:
    """US-134: POST /analyze/stream が SSE で進捗イベントを返す"""
    from app.services import field_templates

    async def mock_stream(*args, **kwargs):
        yield {"step": "evidence", "message": "Evidence 収集中..."}
        yield {"step": "explanation", "message": "Step 1 完了"}
        yield {"step": "fields", "message": "Step 2 完了"}
        yield {"step": "summary", "message": "Step 3 完了"}
        yield {
            "step": "done",
            "result": {
                "summary": "ストリーム要約",
                "field_descriptions": {"hash": "ハッシュ"},
                "explanation": "解説",
                "failed": False,
            },
        }

    with patch.object(field_templates, "_DEFINITIONS_DIR", tmp_path):
        with patch(
            "app.routers.analysis.analyze_payload_with_ollama_stream",
            side_effect=mock_stream,
        ):
            async with AsyncClient(
                transport=ASGITransport(app=app),
                base_url="http://test",
            ) as client:
                post_resp = await client.post("/api/webhooks/receive", json=bitgo_transfer_payload)
                webhook_id = post_resp.json()["id"]
                stream_resp = await client.post(
                    f"/api/webhooks/{webhook_id}/analyze/stream",
                    json={},
                )

    assert stream_resp.status_code == 200
    assert "text/event-stream" in stream_resp.headers.get("content-type", "")

    text = stream_resp.text
    lines = [line for line in text.split("\n") if line.startswith("data: ")]
    events = [json.loads(line[6:]) for line in lines]
    steps = [e.get("step") for e in events]

    assert "evidence" in steps
    assert "explanation" in steps
    assert "fields" in steps
    assert "saved" in steps
    saved_ev = next(e for e in events if e.get("step") == "saved")
    assert "analysis" in saved_ev
    assert saved_ev["analysis"]["summary"] == "ストリーム要約"
