"""Webhook 受信・一覧・詳細・統計 API"""
import json
import logging
from collections import defaultdict
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import PlainTextResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.webhook import Webhook, WebhookAnalysis
from app.schemas.webhook import (
    EventTypeGroup,
    EventTypeGroupResponse,
    SchemaEstimateResponse,
    SchemaField,
    StatsResponse,
    WebhookDetail,
    WebhookListResponse,
    WebhookListItem,
    WebhookReceiveResponse,
)
from app.services.classifier import classify_webhook
from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """新規 Webhook 受信をリアルタイムで配信する WebSocket エンドポイント"""
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        ws_manager.disconnect(websocket)


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

    await ws_manager.broadcast(
        {
            "type": "webhook_received",
            "id": str(webhook.id),
            "source": webhook.source,
            "event_type": webhook.event_type,
        }
    )

    return WebhookReceiveResponse(
        id=webhook.id,
        source=webhook.source,
        event_type=webhook.event_type,
        group_key=webhook.group_key,
    )


@router.get("", response_model=WebhookListResponse)
async def list_webhooks(
    source: str | None = None,
    event_type: str | None = None,
    analyzed: bool | None = None,
    session_id: UUID | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> WebhookListResponse:
    """Webhook 一覧を取得（最新順・ページング対応）"""
    from app.models.webhook import webhook_sessions

    base_stmt = select(Webhook).order_by(Webhook.received_at.desc())
    if source:
        base_stmt = base_stmt.where(Webhook.source == source)
    if event_type:
        base_stmt = base_stmt.where(Webhook.event_type == event_type)
    if session_id:
        base_stmt = base_stmt.join(
            webhook_sessions,
            (Webhook.id == webhook_sessions.c.webhook_id)
            & (webhook_sessions.c.session_id == session_id),
        )
    if analyzed is not None:
        exists_stmt = (
            select(WebhookAnalysis.webhook_id)
            .where(WebhookAnalysis.webhook_id == Webhook.id)
            .exists()
        )
        if analyzed:
            base_stmt = base_stmt.where(exists_stmt)
        else:
            base_stmt = base_stmt.where(~exists_stmt)

    # 総件数を取得
    count_stmt = select(func.count(Webhook.id))
    if source:
        count_stmt = count_stmt.where(Webhook.source == source)
    if event_type:
        count_stmt = count_stmt.where(Webhook.event_type == event_type)
    if session_id:
        count_stmt = count_stmt.join(
            webhook_sessions,
            (Webhook.id == webhook_sessions.c.webhook_id)
            & (webhook_sessions.c.session_id == session_id),
        )
    if analyzed is not None:
        exists_stmt = (
            select(WebhookAnalysis.webhook_id)
            .where(WebhookAnalysis.webhook_id == Webhook.id)
            .exists()
        )
        if analyzed:
            count_stmt = count_stmt.where(exists_stmt)
        else:
            count_stmt = count_stmt.where(~exists_stmt)
    total_result = await db.execute(count_stmt)
    total = total_result.scalar_one() or 0

    # ページ分のデータを取得
    stmt = base_stmt.limit(limit).offset(offset)
    result = await db.execute(stmt)
    rows = result.scalars().all()
    webhook_ids = [w.id for w in rows]

    # 分析済みの webhook_id を取得
    analyzed_ids: set[UUID] = set()
    if webhook_ids:
        analyzed_stmt = select(WebhookAnalysis.webhook_id).where(
            WebhookAnalysis.webhook_id.in_(webhook_ids)
        )
        analyzed_result = await db.execute(analyzed_stmt)
        analyzed_ids = {r[0] for r in analyzed_result.all()}

    items = [
        WebhookListItem(
            id=w.id,
            source=w.source,
            event_type=w.event_type,
            group_key=w.group_key,
            received_at=w.received_at,
            analyzed=w.id in analyzed_ids,
        )
        for w in rows
    ]
    return WebhookListResponse(items=items, total=total)


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


# 未知の event_type（ classifier が判定できなかった場合）を新規タイプとして表示


@router.get(
    "/grouped-by-event-type",
    response_model=EventTypeGroupResponse,
)
async def get_grouped_by_event_type(
    db: AsyncSession = Depends(get_db),
) -> EventTypeGroupResponse:
    """event_type 別にグルーピングし、件数と代表例を返す"""
    subq = (
        select(
            Webhook.event_type,
            func.count(Webhook.id).label("cnt"),
            func.max(Webhook.received_at).label("latest"),
        )
        .group_by(Webhook.event_type)
    )
    agg_result = await db.execute(subq)
    rows = agg_result.all()

    groups: list[EventTypeGroup] = []
    for event_type, cnt, latest in rows:
        sample_stmt = (
            select(Webhook)
            .where(
                Webhook.event_type == event_type,
                Webhook.received_at == latest,
            )
            .limit(1)
        )
        sample_result = await db.execute(sample_stmt)
        sample_wh = sample_result.scalar_one()
        if not sample_wh:
            continue
        is_analyzed = (
            await db.execute(
                select(WebhookAnalysis.webhook_id).where(
                    WebhookAnalysis.webhook_id == sample_wh.id
                )
            )
        ).scalar_one_or_none() is not None
        groups.append(
            EventTypeGroup(
                event_type=event_type,
                count=cnt,
                sample=WebhookListItem(
                    id=sample_wh.id,
                    source=sample_wh.source,
                    event_type=sample_wh.event_type,
                    group_key=sample_wh.group_key,
                    received_at=sample_wh.received_at,
                    analyzed=is_analyzed,
                ),
                is_known=event_type.lower() != "unknown",
            )
        )
    groups.sort(key=lambda g: (-g.count, g.event_type))
    return EventTypeGroupResponse(groups=groups)


def _infer_type(val: object) -> str:
    if val is None:
        return "null"
    if isinstance(val, bool):
        return "boolean"
    if isinstance(val, (int, float)):
        return "number" if isinstance(val, float) else "integer"
    if isinstance(val, str):
        return "string"
    if isinstance(val, list):
        return "array"
    if isinstance(val, dict):
        return "object"
    return "unknown"


def _collect_schema(obj: dict, prefix: str = "") -> dict[str, str]:
    result: dict[str, str] = {}
    for key, val in obj.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(val, dict):
            result[path] = "object"
            result.update(_collect_schema(val, path))
        elif isinstance(val, list):
            result[path] = "array"
            if val and isinstance(val[0], dict):
                result.update(_collect_schema(val[0], f"{path}[]"))
        else:
            result[path] = _infer_type(val)
    return result


def _flatten_schema_with_types(obj: dict, prefix: str = "") -> dict[str, str]:
    """ペイロードを平坦化して パス->型 を返す"""
    result: dict[str, str] = {}
    for key, val in obj.items():
        path = f"{prefix}.{key}" if prefix else key
        if isinstance(val, dict):
            result[path] = "object"
            result.update(_flatten_schema_with_types(val, path))
        elif isinstance(val, list):
            result[path] = "array"
            if val and isinstance(val[0], dict):
                result.update(_flatten_schema_with_types(val[0], f"{path}[]"))
        else:
            result[path] = _infer_type(val)
    return result


@router.get("/schema/estimate", response_model=SchemaEstimateResponse)
async def estimate_schema(
    event_type: str,
    source: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> SchemaEstimateResponse:
    """同一 event_type の Webhook から共通スキーマを推定（3件以上必要）"""
    stmt = select(Webhook).where(Webhook.event_type == event_type)
    if source:
        stmt = stmt.where(Webhook.source == source)
    stmt = stmt.order_by(Webhook.received_at.desc()).limit(100)
    result = await db.execute(stmt)
    webhooks = result.scalars().all()
    if len(webhooks) < 3:
        raise HTTPException(
            status_code=400,
            detail=f"スキーマ推定には同 event_type の Webhook が3件以上必要です（現在 {len(webhooks)} 件）",
        )
    all_fields: dict[str, list[str]] = {}
    for wh in webhooks:
        flat = _flatten_schema_with_types(wh.payload)
        for path, ty in flat.items():
            if path not in all_fields:
                all_fields[path] = []
            all_fields[path].append(ty)
    total = len(webhooks)
    fields = [
        SchemaField(
            path=path,
            type=max(set(tys), key=tys.count),
            occurrence_rate=len(tys) / total,
            required=len(tys) == total,
        )
        for path, tys in sorted(all_fields.items())
    ]
    return SchemaEstimateResponse(
        event_type=event_type,
        source=source,
        total_samples=total,
        fields=fields,
    )


@router.get("/report/markdown", response_class=PlainTextResponse)
async def export_report_markdown(
    db: AsyncSession = Depends(get_db),
) -> PlainTextResponse:
    """分析済み Webhook を source/event_type 別に Markdown レポートとして出力"""
    stmt = (
        select(Webhook, WebhookAnalysis)
        .join(WebhookAnalysis, Webhook.id == WebhookAnalysis.webhook_id)
        .order_by(Webhook.source, Webhook.event_type, Webhook.received_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()

    groups: dict[tuple[str, str], list[tuple]] = defaultdict(list)
    for webhook, analysis in rows:
        if analysis.summary and analysis.summary.startswith("[分析失敗]"):
            continue
        groups[(webhook.source, webhook.event_type)].append((webhook, analysis))

    lines: list[str] = ["# Webhook 調査レポート\n"]
    lines.append(f"生成日時: {datetime.now(timezone.utc).isoformat()}\n")

    for (source, event_type), items in sorted(groups.items()):
        webhook, analysis = items[0]
        lines.append(f"\n## {source} / {event_type}\n")
        if analysis.summary:
            lines.append(f"\n### 要約\n\n{analysis.summary}\n")
        if analysis.field_descriptions:
            lines.append("\n### フィールド説明\n\n")
            for key, desc in analysis.field_descriptions.items():
                lines.append(f"- **{key}**: {desc}\n")
        schema = _collect_schema(webhook.payload)
        if schema:
            lines.append("\n### スキーマ\n\n| フィールド | 型 |\n| --- | --- |\n")
            for path, ty in sorted(schema.items()):
                lines.append(f"| `{path}` | {ty} |\n")
        lines.append("\n### サンプルペイロード\n\n```json\n")
        lines.append(json.dumps(webhook.payload, indent=2, ensure_ascii=False))
        lines.append("\n```\n")

    return PlainTextResponse(
        content="".join(lines),
        media_type="text/markdown",
        headers={"Content-Disposition": "attachment; filename=webhook-report.md"},
    )


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
