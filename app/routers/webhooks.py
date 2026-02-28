"""Webhook 受信・一覧・詳細・統計 API"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.webhook import Webhook
from app.schemas.webhook import (
    StatsResponse,
    WebhookDetail,
    WebhookListItem,
    WebhookReceiveResponse,
)
from app.services.classifier import classify_webhook

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.post("/receive", response_model=WebhookReceiveResponse, status_code=201)
async def receive_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> WebhookReceiveResponse:
    """
    Webhook を受信し、分類して保存する。
    """
    # ペイロードサイズ制限チェック
    body = await request.body()
    from app.config import settings

    if len(body) > settings.webhook_payload_max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"Payload too large (max {settings.webhook_payload_max_bytes} bytes)",
        )

    try:
        payload = await request.json()
    except Exception as e:
        logger.warning("Invalid JSON body: %s", e)
        raise HTTPException(status_code=400, detail="Invalid JSON") from e

    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload must be a JSON object")

    classification = classify_webhook(payload)
    webhook = Webhook(
        source=classification.source,
        event_type=classification.event_type,
        group_key=classification.group_key,
        payload=payload,
    )
    db.add(webhook)
    await db.flush()
    await db.refresh(webhook)

    logger.info(
        "Webhook received id=%s source=%s event_type=%s",
        webhook.id,
        webhook.source,
        webhook.event_type,
    )

    return WebhookReceiveResponse(
        id=webhook.id,
        source=webhook.source,
        event_type=webhook.event_type,
        group_key=webhook.group_key,
    )


@router.get("", response_model=list[WebhookListItem])
async def list_webhooks(
    source: str | None = None,
    event_type: str | None = None,
    limit: int = 50,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> list[WebhookListItem]:
    """Webhook 一覧を取得（最新順）"""
    stmt = select(Webhook).order_by(Webhook.received_at.desc())
    if source:
        stmt = stmt.where(Webhook.source == source)
    if event_type:
        stmt = stmt.where(Webhook.event_type == event_type)
    stmt = stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    rows = result.scalars().all()

    return [
        WebhookListItem(
            id=w.id,
            source=w.source,
            event_type=w.event_type,
            group_key=w.group_key,
            received_at=w.received_at,
        )
        for w in rows
    ]


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: AsyncSession = Depends(get_db)) -> StatsResponse:
    """ソース別・イベントタイプ別の統計を取得"""
    by_source_stmt = select(Webhook.source, func.count(Webhook.id)).group_by(
        Webhook.source
    )
    by_source_result = await db.execute(by_source_stmt)
    by_source = {row[0]: row[1] for row in by_source_result.all()}

    by_event_stmt = select(Webhook.event_type, func.count(Webhook.id)).group_by(
        Webhook.event_type
    )
    by_event_result = await db.execute(by_event_stmt)
    by_event_type = {row[0]: row[1] for row in by_event_result.all()}

    return StatsResponse(by_source=by_source, by_event_type=by_event_type)


@router.get("/{webhook_id}", response_model=WebhookDetail)
async def get_webhook(
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> WebhookDetail:
    """Webhook 詳細を取得"""
    stmt = select(Webhook).where(Webhook.id == webhook_id)
    result = await db.execute(stmt)
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    return WebhookDetail(
        id=webhook.id,
        source=webhook.source,
        event_type=webhook.event_type,
        group_key=webhook.group_key,
        payload=webhook.payload,
        received_at=webhook.received_at,
    )
