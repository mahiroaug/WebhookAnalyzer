"""US-162/US-177/US-178: サービス接続状況 API"""
import logging
import time
from typing import Literal

import httpx
from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.db.session import engine

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


def _error_message(exc: BaseException) -> str:
    """例外からツールチップ表示用の短いエラーメッセージを生成"""
    msg = str(exc).strip() or type(exc).__name__
    if len(msg) > 80:
        msg = msg[:77] + "..."
    return msg


@router.get("/services")
async def get_health_services() -> dict:
    """
    US-162/US-177/US-178: 各サービスの接続状況を返す。
    (1) 公開 URL（ngrok 等）、(2) ローカル API、(3) Vite、(4) PostgreSQL、(5) Ollama
    各チェックで latency_ms, checked_at, error を返す。
    """
    checked_at = time.time()
    ngrok_url = settings.ngrok_api_url

    # (1) ngrok 公開 URL（US-178: トンネル存在 + 公開URLへのHEADでE2E疎通確認）
    public_url = ""
    public_status: Literal["live", "offline"] = "offline"
    public_latency_ms: int | None = None
    public_error: str | None = None
    try:
        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{ngrok_url.rstrip('/')}/api/tunnels")
            if r.status_code == 200:
                data = r.json()
                tunnels = data.get("tunnels", [])
                for t in tunnels:
                    public = t.get("public_url") or ""
                    if public and public.startswith("http"):
                        public_url = f"{public.rstrip('/')}/api/webhooks/receive"
                        # US-178: 公開URLへのHEADで外部到達可能か確認
                        try:
                            head_r = await client.head(public_url, follow_redirects=True)
                            if head_r.status_code < 500:
                                public_status = "live"
                            else:
                                public_error = f"HTTP {head_r.status_code}"
                        except Exception as e2:
                            public_error = _error_message(e2)
                        break
        public_latency_ms = int((time.perf_counter() - t0) * 1000)
    except Exception as e:
        public_error = _error_message(e)
        logger.debug("ngrok check failed: %s", e)

    # (2) ローカル API（このエンドポイントに到達している時点で Live）
    local_api_status: Literal["live", "offline"] = "live"
    local_api_latency_ms: int | None = 0
    local_api_error: str | None = None

    # (3) Vite（US-177: フロントエンド dev server）
    vite_status: Literal["live", "offline"] = "offline"
    vite_latency_ms: int | None = None
    vite_error: str | None = None
    try:
        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get("http://localhost:5173")
            if r.status_code == 200:
                vite_status = "live"
            else:
                vite_error = f"HTTP {r.status_code}"
        vite_latency_ms = int((time.perf_counter() - t0) * 1000)
    except Exception as e:
        vite_error = _error_message(e)
        vite_latency_ms = None
        logger.debug("Vite check failed: %s", e)

    # (4) PostgreSQL
    pg_status: Literal["live", "offline"] = "offline"
    pg_latency_ms: int | None = None
    pg_error: str | None = None
    try:
        t0 = time.perf_counter()
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        pg_status = "live"
        pg_latency_ms = int((time.perf_counter() - t0) * 1000)
    except Exception as e:
        pg_error = _error_message(e)
        logger.debug("PostgreSQL check failed: %s", e)

    # (5) Ollama（US-178: /api/tags の models に ollama_model が含まれるか確認）
    ollama_status: Literal["live", "offline"] = "offline"
    ollama_latency_ms: int | None = None
    ollama_error: str | None = None
    try:
        t0 = time.perf_counter()
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{settings.ollama_host.rstrip('/')}/api/tags")
            if r.status_code == 200:
                data = r.json()
                models = data.get("models", [])
                model_names = [m.get("name", "") for m in models if isinstance(m, dict)]
                # gemma3:4b は gemma3:4b または gemma3:4b:latest 等にマッチ
                if any(
                    n == settings.ollama_model or n.startswith(settings.ollama_model + ":")
                    for n in model_names
                ):
                    ollama_status = "live"
                else:
                    ollama_error = "model not loaded"
            else:
                ollama_error = f"HTTP {r.status_code}"
        ollama_latency_ms = int((time.perf_counter() - t0) * 1000)
    except Exception as e:
        ollama_error = _error_message(e)
        ollama_latency_ms = None
        logger.debug("Ollama check failed: %s", e)

    # US-177: URL はホスト到達可能な localhost 形式に統一
    return {
        "checked_at": checked_at,
        "public_url": {
            "url": public_url or "—",
            "status": public_status,
            "latency_ms": public_latency_ms,
            "error": public_error,
        },
        "local_api": {
            "url": "http://localhost:8000",
            "status": local_api_status,
            "latency_ms": local_api_latency_ms,
            "error": local_api_error,
        },
        "vite": {
            "url": "http://localhost:5173",
            "status": vite_status,
            "latency_ms": vite_latency_ms,
            "error": vite_error,
        },
        "postgresql": {
            "url": "http://localhost:5432",
            "status": pg_status,
            "latency_ms": pg_latency_ms,
            "error": pg_error,
        },
        "ollama": {
            "url": "http://localhost:11434",
            "status": ollama_status,
            "latency_ms": ollama_latency_ms,
            "error": ollama_error,
        },
    }
