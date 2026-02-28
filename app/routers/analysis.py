"""Webhook AI 分析 API"""
import json
import logging
import time
import uuid
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select

from app.db.session import async_session, get_db
from app.models.webhook import Webhook, WebhookAnalysis
from app.schemas.analysis import (
    AnalyzeTriggerRequest,
    AnalyzeTriggerResponse,
    BatchAnalyzeRequest,
    BatchAnalyzeResponse,
    WebhookAnalysisResponse,
)
from app.services.field_templates import (
    get_field_template,
    load_analysis_from_yaml,
    write_analysis_to_yaml,
)
from app.services.llm.ollama_analyzer import (
    AnalysisResult,
    analyze_payload_with_ollama,
    analyze_payload_with_ollama_stream,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["analysis"])


@router.post("/batch-analyze", response_model=BatchAnalyzeResponse)
async def batch_analyze(
    body: BatchAnalyzeRequest,
    db=Depends(get_db),
) -> BatchAnalyzeResponse:
    """未分析 Webhook を一括で分析する（最大50件）"""
    ids = body.webhook_ids[:50]
    if not ids:
        return BatchAnalyzeResponse(total=0, completed=0, failed=0)

    completed = 0
    failed = 0
    for webhook_id in ids:
        try:
            stmt = select(Webhook).where(Webhook.id == webhook_id)
            result = await db.execute(stmt)
            webhook = result.scalar_one_or_none()
            if not webhook:
                failed += 1
                continue
            template = get_field_template(webhook.source, webhook.event_type)
            analysis_result = await analyze_payload_with_ollama(
                webhook.payload,
                template_context=template,
                source=webhook.source,
                event_type=webhook.event_type,
            )
            del_stmt = select(WebhookAnalysis).where(
                WebhookAnalysis.webhook_id == webhook_id
            )
            existing = (await db.execute(del_stmt)).scalars().all()
            for a in existing:
                await db.delete(a)
            if analysis_result.failed:
                record = WebhookAnalysis(
                    webhook_id=webhook_id,
                    summary=f"[分析失敗] {analysis_result.error_message or 'unknown'}",
                    field_descriptions={},
                    explanation=None,
                )
            else:
                record = WebhookAnalysis(
                    webhook_id=webhook_id,
                    summary=analysis_result.summary,
                    field_descriptions=analysis_result.field_descriptions,
                    explanation=analysis_result.explanation or None,
                )
                try:
                    write_analysis_to_yaml(
                        webhook.source,
                        webhook.event_type,
                        analysis_result.summary,
                        analysis_result.field_descriptions,
                    )
                except Exception as e:
                    logger.warning("YAML 書き出し失敗（分析結果は DB に保存済み）: %s", e)
            db.add(record)
            completed += 1
        except Exception:
            failed += 1

    return BatchAnalyzeResponse(
        total=len(ids),
        completed=completed,
        failed=failed,
    )


@router.post("/{webhook_id}/analyze", response_model=AnalyzeTriggerResponse)
async def trigger_analyze(
    webhook_id: UUID,
    body: AnalyzeTriggerRequest | None = Body(None),
    db=Depends(get_db),
) -> AnalyzeTriggerResponse:
    """指定 Webhook を分析し、結果を保存する。LLM 障害時も 500 にせず失敗記録を返す。US-128: オプションで user_feedback を渡すと Step 1 プロンプトに反映。"""
    stmt = select(Webhook).where(Webhook.id == webhook_id)
    result = await db.execute(stmt)
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    user_feedback = (body.user_feedback or "").strip() if body else ""

    try:
        template = get_field_template(webhook.source, webhook.event_type)
        analysis_result = await analyze_payload_with_ollama(
            webhook.payload,
            template_context=template,
            user_feedback=user_feedback if user_feedback else None,
            source=webhook.source,
            event_type=webhook.event_type,
        )
    except Exception as e:
        logger.error("分析処理で予期しない例外: %s", e, exc_info=True)
        from app.services.llm.ollama_analyzer import AnalysisResult
        analysis_result = AnalysisResult(
            summary="",
            field_descriptions={},
            failed=True,
            error_message=f"unexpected: {str(e)[:180]}",
        )

    del_stmt = select(WebhookAnalysis).where(WebhookAnalysis.webhook_id == webhook_id)
    existing = (await db.execute(del_stmt)).scalars().all()
    for a in existing:
        await db.delete(a)

    if analysis_result.failed:
        record = WebhookAnalysis(
            webhook_id=webhook_id,
            summary=f"[分析失敗] {analysis_result.error_message or 'unknown'}",
            field_descriptions={},
            explanation=None,
        )
    else:
        record = WebhookAnalysis(
            webhook_id=webhook_id,
            summary=analysis_result.summary,
            field_descriptions=analysis_result.field_descriptions,
            explanation=analysis_result.explanation or None,
        )
        try:
            write_analysis_to_yaml(
                webhook.source,
                webhook.event_type,
                analysis_result.summary,
                analysis_result.field_descriptions,
            )
        except Exception as e:
            logger.warning("YAML 書き出し失敗（分析結果は DB に保存済み）: %s", e)

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
        explanation=record.explanation,
        analyzed_at=record.analyzed_at,
    )


@router.post("/{webhook_id}/analyze/stream")
async def trigger_analyze_stream(
    webhook_id: UUID,
    body: AnalyzeTriggerRequest | None = Body(None),
) -> StreamingResponse:
    """
    US-134: 分析を SSE でストリーミング。進捗ログをリアルタイム配信し、最後に結果を返す。
    """
    async with async_session() as db:
        stmt = select(Webhook).where(Webhook.id == webhook_id)
        result = await db.execute(stmt)
        webhook = result.scalar_one_or_none()
        if not webhook:
            raise HTTPException(status_code=404, detail="Webhook not found")

    user_feedback = (body.user_feedback or "").strip() if body else ""
    webhook_id_val = webhook_id
    webhook_source = webhook.source
    webhook_event_type = webhook.event_type
    webhook_payload = webhook.payload

    async def gen():
        total_start = time.perf_counter()
        last_result = None
        try:
            template = get_field_template(webhook_source, webhook_event_type)
            async for event in analyze_payload_with_ollama_stream(
                webhook_payload,
                template_context=template,
                user_feedback=user_feedback or None,
                source=webhook_source,
                event_type=webhook_event_type,
            ):
                if event.get("step") == "done":
                    last_result = event.get("result")
                event["total_elapsed_ms"] = round((time.perf_counter() - total_start) * 1000, 1)
                yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
            if last_result:
                yield f"data: {json.dumps({'step': 'write_yaml', 'message': 'YAML 書き出し', 'total_elapsed_ms': round((time.perf_counter() - total_start) * 1000, 1)}, ensure_ascii=False)}\n\n"
        except Exception as e:
            logger.error("分析ストリームで例外: %s", e, exc_info=True)
            yield f"data: {json.dumps({'step': 'error', 'message': str(e)[:200], 'total_elapsed_ms': round((time.perf_counter() - total_start) * 1000, 1)}, ensure_ascii=False)}\n\n"
            return

        if not last_result:
            yield f"data: {json.dumps({'step': 'error', 'message': 'No result'}, ensure_ascii=False)}\n\n"
            return

        res = last_result
        async with async_session() as db:
            if res.get("failed"):
                record = WebhookAnalysis(
                    webhook_id=webhook_id_val,
                    summary=f"[分析失敗] {res.get('error_message', 'unknown')}",
                    field_descriptions={},
                    explanation=None,
                )
            else:
                record = WebhookAnalysis(
                    webhook_id=webhook_id_val,
                    summary=res.get("summary", ""),
                    field_descriptions=res.get("field_descriptions") or {},
                    explanation=res.get("explanation"),
                )
                try:
                    write_analysis_to_yaml(
                        webhook_source,
                        webhook_event_type,
                        res.get("summary", ""),
                        res.get("field_descriptions") or {},
                    )
                except Exception as e:
                    logger.warning("YAML 書き出し失敗: %s", e)
            del_stmt = select(WebhookAnalysis).where(WebhookAnalysis.webhook_id == webhook_id_val)
            existing = (await db.execute(del_stmt)).scalars().all()
            for a in existing:
                await db.delete(a)
            db.add(record)
            await db.commit()
            await db.refresh(record)
        yield f"data: {json.dumps({'step': 'saved', 'analysis': {'id': str(record.id), 'summary': record.summary, 'field_descriptions': record.field_descriptions or {}, 'explanation': record.explanation, 'analyzed_at': record.analyzed_at.isoformat()}, 'total_elapsed_ms': round((time.perf_counter() - total_start) * 1000, 1)}, ensure_ascii=False, default=str)}\n\n"

    return StreamingResponse(
        gen(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.get("/{webhook_id}/analysis", response_model=WebhookAnalysisResponse)
async def get_analysis(
    webhook_id: UUID,
    db=Depends(get_db),
) -> WebhookAnalysisResponse:
    """
    保存済み分析結果を取得する。
    US-126: DB にない場合は定義ファイルから読み込み（DB 優先）。
    """
    stmt = select(WebhookAnalysis).where(
        WebhookAnalysis.webhook_id == webhook_id
    ).order_by(WebhookAnalysis.analyzed_at.desc()).limit(1)
    result = await db.execute(stmt)
    record = result.scalar_one_or_none()
    if record:
        return WebhookAnalysisResponse(
            id=record.id,
            webhook_id=record.webhook_id,
            summary=record.summary,
            field_descriptions=record.field_descriptions or {},
            explanation=record.explanation,
            analyzed_at=record.analyzed_at,
            from_definition_file=False,
        )

    # US-126: DB にない場合、定義ファイルから読み込み
    webhook_stmt = select(Webhook).where(Webhook.id == webhook_id)
    webhook_result = await db.execute(webhook_stmt)
    webhook = webhook_result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    cached = load_analysis_from_yaml(webhook.source, webhook.event_type)
    if cached:
        summary, field_descriptions = cached
        return WebhookAnalysisResponse(
            id=uuid.uuid4(),
            webhook_id=webhook_id,
            summary=summary,
            field_descriptions=field_descriptions,
            explanation=None,  # US-127: 定義ファイルには explanation は保存しない
            analyzed_at=datetime.now(timezone.utc),
            from_definition_file=True,
        )

    raise HTTPException(status_code=404, detail="Analysis not found")
