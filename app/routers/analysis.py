"""Webhook AI 分析 API"""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select

from app.db.session import get_db
from app.models.webhook import Webhook, WebhookAnalysis
from app.schemas.analysis import AnalyzeTriggerResponse, WebhookAnalysisResponse
from app.services.llm.ollama_analyzer import analyze_payload_with_ollama

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["analysis"])


@router.post("/{webhook_id}/analyze", response_model=AnalyzeTriggerResponse)
async def trigger_analyze(
    webhook_id: UUID,
    db=Depends(get_db),
) -> AnalyzeTriggerResponse:
    """指定 Webhook を Ollama で分析し、結果を保存する"""
    stmt = select(Webhook).where(Webhook.id == webhook_id)
    result = await db.execute(stmt)
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    analysis_result = await analyze_payload_with_ollama(webhook.payload)

    # 既存の分析を削除してから新規作成（1対1で最新を保持）
    del_stmt = select(WebhookAnalysis).where(WebhookAnalysis.webhook_id == webhook_id)
    existing = (await db.execute(del_stmt)).scalars().all()
    for a in existing:
        await db.delete(a)

    if analysis_result.failed:
        # フォールバック: 失敗記録を保存
        record = WebhookAnalysis(
            webhook_id=webhook_id,
            summary=f"[分析失敗] {analysis_result.error_message or 'unknown'}",
            field_descriptions={},
        )
    else:
        record = WebhookAnalysis(
            webhook_id=webhook_id,
            summary=analysis_result.summary,
            field_descriptions=analysis_result.field_descriptions,
        )
    db.add(record)
    await db.flush()
    await db.refresh(record)

    logger.info(
        "Webhook analyzed id=%s webhook_id=%s failed=%s",
        record.id,
        webhook_id,
        analysis_result.failed,
    )

    return AnalyzeTriggerResponse(
        id=record.id,
        webhook_id=record.webhook_id,
        summary=record.summary,
        field_descriptions=record.field_descriptions or {},
        analyzed_at=record.analyzed_at,
    )


@router.get("/{webhook_id}/analysis", response_model=WebhookAnalysisResponse)
async def get_analysis(
    webhook_id: UUID,
    db=Depends(get_db),
) -> WebhookAnalysisResponse:
    """保存済み分析結果を取得する"""
    stmt = select(WebhookAnalysis).where(
        WebhookAnalysis.webhook_id == webhook_id
    ).order_by(WebhookAnalysis.analyzed_at.desc()).limit(1)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="Analysis not found")

    return WebhookAnalysisResponse(
        id=record.id,
        webhook_id=record.webhook_id,
        summary=record.summary,
        field_descriptions=record.field_descriptions or {},
        analyzed_at=record.analyzed_at,
    )
