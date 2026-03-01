"""Webhook 受信・一覧・詳細・統計 API"""
import json
import logging
from collections import defaultdict
from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import PlainTextResponse, Response
from sqlalchemy import Text, cast, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.webhook import Webhook, WebhookAnalysis
from app.schemas.webhook import (
    AdjacentResponse,
    EventTypeGroup,
    EventTypeGroupResponse,
    FieldTemplateItem,
    FieldTemplateResponse,
    MatchedRule,
    ReplayRequest,
    ReplayResponse,
    SchemaEstimateResponse,
    SchemaField,
    StatsResponse,
    WebhookDetail,
    WebhookListResponse,
    WebhookListItem,
    WebhookReceiveResponse,
)
from app.services.alert_rules import evaluate_rules
from app.services.pdf_export import build_webhook_pdf
from app.services.classifier import classify_webhook
from app.services.field_templates import get_field_template
from app.services.schema_drift import (
    compute_drift,
    schema_drift_to_dict,
)
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

    # US-113: 受信順グローバルインデックスを採番
    max_idx_result = await db.execute(select(func.max(Webhook.sequence_index)))
    current_max = max_idx_result.scalar() or 0

    # US-116: HTTP リクエストメタデータを保存
    http_method = request.method
    remote_ip = request.client.host if request.client else None
    raw_headers = {k: v for k, v in request.headers.items() if k.lower() != "content-length"}

    webhook = Webhook(
        source=classification.source,
        event_type=classification.event_type,
        group_key=classification.group_key,
        payload=payload,
        sequence_index=current_max + 1,
        http_method=http_method,
        remote_ip=remote_ip,
        request_headers=raw_headers,
    )
    db.add(webhook)
    await db.flush()
    await db.refresh(webhook)

    # スキーマドリフト検知: 同 event_type の他 Webhook を基準に比較
    other_stmt = (
        select(Webhook)
        .where(
            Webhook.event_type == webhook.event_type,
            Webhook.id != webhook.id,
        )
        .order_by(Webhook.received_at.desc())
        .limit(50)
    )
    other_result = await db.execute(other_stmt)
    others = other_result.scalars().all()
    if len(others) >= 1:
        all_fields: dict[str, list[tuple[str, bool]]] = {}
        for wh in others:
            flat = _flatten_schema_with_types(wh.payload)
            for path, ty in flat.items():
                if path not in all_fields:
                    all_fields[path] = []
                all_fields[path].append((ty, True))
        total = len(others)
        baseline: dict[str, tuple[str, bool]] = {}
        for path, entries in all_fields.items():
            types = [e[0] for e in entries]
            required = len(entries) == total
            dominant_type = max(set(types), key=types.count)
            baseline[path] = (dominant_type, required)
        drift_result = compute_drift(webhook.payload, baseline)
        webhook.schema_drift = schema_drift_to_dict(drift_result)
        await db.flush()

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


def _escape_like_pattern(s: str, escape: str = "\\") -> str:
    """LIKE/ILIKE 用のワイルドカードエスケープ（% _ \\）"""
    return (
        s.replace(escape, escape + escape)
        .replace("%", escape + "%")
        .replace("_", escape + "_")
    )


@router.get("", response_model=WebhookListResponse)
async def list_webhooks(
    source: str | None = None,
    event_type: str | None = None,
    analyzed: bool | None = None,
    has_drift: bool | None = None,
    is_read: bool | None = None,  # US-160
    session_id: UUID | None = None,
    q: str | None = None,
    limit: int = 20,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
) -> WebhookListResponse:
    """Webhook 一覧を取得（最新順・ページング対応）。q で payload 全文検索。"""
    from app.models.webhook import webhook_sessions

    q_stripped = (q or "").strip()
    base_stmt = select(Webhook).order_by(Webhook.received_at.desc())
    if q_stripped:
        pattern = f"%{_escape_like_pattern(q_stripped)}%"
        payload_text = cast(Webhook.payload, Text)
        base_stmt = base_stmt.where(payload_text.ilike(pattern, escape="\\"))

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
    if has_drift is not None:
        if has_drift:
            base_stmt = base_stmt.where(
                Webhook.schema_drift.isnot(None),
                Webhook.schema_drift["has_drift"].astext == "true",
            )
        else:
            base_stmt = base_stmt.where(
                or_(
                    Webhook.schema_drift.is_(None),
                    Webhook.schema_drift["has_drift"].astext != "true",
                )
            )
    if is_read is not None:
        base_stmt = base_stmt.where(Webhook.is_read == is_read)

    # 総件数を取得
    count_stmt = select(func.count(Webhook.id))
    if q_stripped:
        pattern = f"%{_escape_like_pattern(q_stripped)}%"
        payload_text = cast(Webhook.payload, Text)
        count_stmt = count_stmt.where(payload_text.ilike(pattern, escape="\\"))
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
    if has_drift is not None:
        if has_drift:
            count_stmt = count_stmt.where(
                Webhook.schema_drift.isnot(None),
                Webhook.schema_drift["has_drift"].astext == "true",
            )
        else:
            count_stmt = count_stmt.where(
                or_(
                    Webhook.schema_drift.is_(None),
                    Webhook.schema_drift["has_drift"].astext != "true",
                )
            )
    if is_read is not None:
        count_stmt = count_stmt.where(Webhook.is_read == is_read)
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

    def _has_drift(w: Webhook) -> bool:
        if not w.schema_drift or not isinstance(w.schema_drift, dict):
            return False
        return bool(w.schema_drift.get("has_drift"))

    items = [
        WebhookListItem(
            id=w.id,
            source=w.source,
            event_type=w.event_type,
            group_key=w.group_key,
            received_at=w.received_at,
            analyzed=w.id in analyzed_ids,
            has_drift=_has_drift(w),
            sequence_index=w.sequence_index,
            http_method=w.http_method,
            remote_ip=w.remote_ip,
            matched_rules=[
                MatchedRule(id=r["id"], name=r["name"]) for r in evaluate_rules(w.payload or {})
            ],
            is_read=w.is_read,
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


@router.get("/field-templates", response_model=FieldTemplateResponse)
async def get_field_templates_api(
    source: str,
    event_type: str,
) -> FieldTemplateResponse:
    """
    サービス別・event_type 別のフィールド辞書テンプレートを返す。
    未対応の source/event_type の場合は 404。
    """
    template = get_field_template(source, event_type)
    if template is None:
        raise HTTPException(
            status_code=404,
            detail=f"No field template for source={source} event_type={event_type}",
        )
    return FieldTemplateResponse(
        source=source,
        event_type=event_type,
        fields=[
            FieldTemplateItem(
                path=f.path,
                description=f.description,
                notes=f.notes,
                reference_url=f.reference_url,
            )
            for f in template
        ],
    )


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
                    matched_rules=[
                        MatchedRule(id=r["id"], name=r["name"])
                        for r in evaluate_rules(sample_wh.payload or {})
                    ],
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


@router.post("/mark-all-read", status_code=200)
async def mark_all_webhooks_read(
    source: str | None = None,
    event_type: str | None = None,
    q: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """US-167: フィルタ条件に一致する全 Webhook を既読にする"""
    base_stmt = select(Webhook)
    q_stripped = (q or "").strip()
    if q_stripped:
        pattern = f"%{_escape_like_pattern(q_stripped)}%"
        payload_text = cast(Webhook.payload, Text)
        base_stmt = base_stmt.where(payload_text.ilike(pattern, escape="\\"))
    if source:
        base_stmt = base_stmt.where(Webhook.source == source)
    if event_type:
        base_stmt = base_stmt.where(Webhook.event_type == event_type)

    result = await db.execute(base_stmt)
    rows = result.scalars().all()
    count = 0
    for w in rows:
        if not w.is_read:
            w.is_read = True
            count += 1
    await db.commit()
    return {"marked_count": count}


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


@router.get("/{webhook_id}/adjacent", response_model=AdjacentResponse)
async def get_adjacent_webhooks(
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> AdjacentResponse:
    """指定 Webhook の前後（時系列）の ID を取得。US-110"""
    # 現在の webhook の received_at を取得
    current_stmt = select(Webhook).where(Webhook.id == webhook_id)
    curr = await db.execute(current_stmt)
    current = curr.scalar_one_or_none()
    if not current:
        raise HTTPException(status_code=404, detail="Webhook not found")

    # prev: より新しい（received_at が大きい）1件
    prev_stmt = (
        select(Webhook.id)
        .where(Webhook.received_at > current.received_at)
        .order_by(Webhook.received_at.asc())
        .limit(1)
    )
    prev_result = await db.execute(prev_stmt)
    prev_row = prev_result.scalar_one_or_none()

    # next: より古い（received_at が小さい）1件
    next_stmt = (
        select(Webhook.id)
        .where(Webhook.received_at < current.received_at)
        .order_by(Webhook.received_at.desc())
        .limit(1)
    )
    next_result = await db.execute(next_stmt)
    next_row = next_result.scalar_one_or_none()

    return AdjacentResponse(
        prev_id=prev_row if prev_row else None,
        next_id=next_row if next_row else None,
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
        schema_drift=webhook.schema_drift,
        sequence_index=webhook.sequence_index,
        http_method=webhook.http_method,
        remote_ip=webhook.remote_ip,
        request_headers=webhook.request_headers,
        matched_rules=[
            MatchedRule(id=r["id"], name=r["name"]) for r in evaluate_rules(webhook.payload or {})
        ],
    )


@router.patch("/{webhook_id}/read", status_code=204)
async def mark_webhook_read(
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """US-160: Webhook を既読にする"""
    stmt = select(Webhook).where(Webhook.id == webhook_id)
    result = await db.execute(stmt)
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")
    webhook.is_read = True
    await db.commit()


@router.get("/{webhook_id}/export/pdf")
async def export_webhook_pdf(
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> Response:
    """US-166: 個別 Webhook を PDF レポートとしてダウンロード"""
    wh_stmt = select(Webhook).where(Webhook.id == webhook_id)
    wh_result = await db.execute(wh_stmt)
    webhook = wh_result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    anal_stmt = select(WebhookAnalysis).where(WebhookAnalysis.webhook_id == webhook_id)
    anal_result = await db.execute(anal_stmt)
    analysis = anal_result.scalar_one_or_none()

    summary = analysis.summary if analysis else None
    explanation = analysis.explanation if analysis else None
    field_descriptions = analysis.field_descriptions if analysis else None

    pdf_bytes = build_webhook_pdf(
        source=webhook.source,
        event_type=webhook.event_type,
        group_key=webhook.group_key,
        received_at=webhook.received_at,
        http_method=webhook.http_method,
        remote_ip=webhook.remote_ip,
        request_headers=webhook.request_headers,
        payload=webhook.payload or {},
        analysis_summary=summary,
        analysis_explanation=explanation,
        analysis_field_descriptions=field_descriptions,
    )
    filename = f"webhook-{webhook_id}-{webhook.source}-{webhook.event_type}.pdf".replace(" ", "_")
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.post("/{webhook_id}/replay", response_model=ReplayResponse)
async def replay_webhook(
    webhook_id: UUID,
    body: ReplayRequest,
    db: AsyncSession = Depends(get_db),
) -> ReplayResponse:
    """US-145: 指定 Webhook の payload を対象 URL へ再送する"""
    import time

    import httpx

    stmt = select(Webhook).where(Webhook.id == webhook_id)
    result = await db.execute(stmt)
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook not found")

    target = (body.target_url or "").strip()
    if not target or not target.startswith(("http://", "https://")):
        raise HTTPException(status_code=400, detail="Invalid target_url")

    headers: dict[str, str] = {"Content-Type": "application/json"}
    if webhook.request_headers:
        for k, v in webhook.request_headers.items():
            if k.lower() in ("content-type", "content-length"):
                continue
            if isinstance(v, str):
                headers[k] = v

    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                target,
                json=webhook.payload,
                headers=headers,
            )
        elapsed = (time.perf_counter() - start) * 1000
        return ReplayResponse(
            status_code=resp.status_code,
            elapsed_ms=round(elapsed, 1),
            success=200 <= resp.status_code < 300,
        )
    except httpx.ConnectError as e:
        elapsed = (time.perf_counter() - start) * 1000
        return ReplayResponse(
            status_code=0,
            elapsed_ms=round(elapsed, 1),
            success=False,
            error=f"Connection error: {str(e)[:200]}",
        )
    except Exception as e:
        elapsed = (time.perf_counter() - start) * 1000
        return ReplayResponse(
            status_code=0,
            elapsed_ms=round(elapsed, 1),
            success=False,
            error=str(e)[:200],
        )
