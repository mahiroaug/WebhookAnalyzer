"""US-162: サービス接続状況 API"""
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
    US-162: 各サービスの接続状況を返す。
    (1) 公開 URL（ngrok 等）、(2) ローカル API、(3) PostgreSQL、(4) Ollama
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
                        public_url = public
                        public_status = "live"
                        break
    except Exception as e:
        logger.debug("ngrok check failed: %s", e)

    # (2) ローカル API（このエンドポイントに到達している時点で Live）
    local_api_status: Literal["live", "offline"] = "live"

    # (3) PostgreSQL
    pg_status: Literal["live", "offline"] = "offline"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        pg_status = "live"
    except Exception as e:
        logger.debug("PostgreSQL check failed: %s", e)

    # (4) Ollama
    ollama_status: Literal["live", "offline"] = "offline"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            r = await client.get(f"{settings.ollama_host.rstrip('/')}/api/tags")
            if r.status_code == 200:
                ollama_status = "live"
    except Exception as e:
        logger.debug("Ollama check failed: %s", e)

    return {
        "public_url": {
            "url": public_url or "—",
            "status": public_status,
        },
        "local_api": {
            "url": "http://localhost:8000",
            "status": local_api_status,
        },
        "postgresql": {"status": pg_status},
        "ollama": {"status": ollama_status},
    }
