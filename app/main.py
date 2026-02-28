"""FastAPI アプリケーション エントリーポイント"""
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import analysis, webhooks

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="Webhook Analyzer",
    description="Webhook 受信・分類・保管・分析 API",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(webhooks.router, prefix="/api")
app.include_router(analysis.router, prefix="/api")


@app.get("/health")
async def health() -> dict:
    """ヘルスチェック"""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
