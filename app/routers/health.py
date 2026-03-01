"""US-162/US-177: サービス接続状況 API"""
import logging
from typing import Literal

import httpx
from fastapi import APIRouter
from sqlalchemy import text

from app.config import settings
from app.db.session import engine

logger = logging.getLogger(__name__)

router = APIRouter(tags=["health"])


@router.get("/services")
async def get_health_services() -> dict:
    """
    US-162/US-177: 各サービスの接続状況を返す。
    (1) 公開 URL（ngrok 等）、(2) ローカル API、(3) Vite、(4) PostgreSQL、(5) Ollama
    """
    ngrok_url = settings.ngrok_api_url

    # (1) ngrok 公開 URL
    public_url = ""
    public_status: Literal["live", "offline"] = "offline"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{ngrok_url.rstrip('/')}/api/tunnels")
            if r.status_code == 200:
                data = r.json()
                tunnels = data.get("tunnels", [])
                for t in tunnels:
                    public = t.get("public_url") or ""
                    if public and public.startswith("http"):
                        public_url = f"{public.rstrip('/')}/api/webhooks/receive"
                        public_status = "live"
                        break
    except Exception as e:
        logger.debug("ngrok check failed: %s", e)

    # (2) ローカル API（このエンドポイントに到達している時点で Live）
    local_api_status: Literal["live", "offline"] = "live"

    # (3) Vite（US-177: フロントエンド dev server）
    vite_status: Literal["live", "offline"] = "offline"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get("http://localhost:5173")
            if r.status_code == 200:
                vite_status = "live"
    except Exception as e:
        logger.debug("Vite check failed: %s", e)

    # (4) PostgreSQL
    pg_status: Literal["live", "offline"] = "offline"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        pg_status = "live"
    except Exception as e:
        logger.debug("PostgreSQL check failed: %s", e)

    # (5) Ollama
    ollama_status: Literal["live", "offline"] = "offline"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{settings.ollama_host.rstrip('/')}/api/tags")
            if r.status_code == 200:
                ollama_status = "live"
    except Exception as e:
        logger.debug("Ollama check failed: %s", e)

    # US-177: URL はホスト到達可能な localhost 形式に統一
    return {
        "public_url": {
            "url": public_url or "—",
            "status": public_status,
        },
        "local_api": {
            "url": "http://localhost:8000",
            "status": local_api_status,
        },
        "vite": {
            "url": "http://localhost:5173",
            "status": vite_status,
        },
        "postgresql": {"url": "http://localhost:5432", "status": pg_status},
        "ollama": {"url": "http://localhost:11434", "status": ollama_status},
    }
