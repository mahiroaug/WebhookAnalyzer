"""調査セッション API"""
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select

from app.db.session import get_db
from app.models.webhook import InvestigationSession, Webhook, webhook_sessions
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/sessions", tags=["sessions"])


class SessionCreate(BaseModel):
    name: str


class SessionResponse(BaseModel):
    id: UUID
    name: str
    webhook_count: int
    created_at: str


class SessionListResponse(BaseModel):
    sessions: list[SessionResponse]


@router.get("", response_model=SessionListResponse)
async def list_sessions(db: AsyncSession = Depends(get_db)) -> SessionListResponse:
    """セッション一覧を取得（件数・期間付き）"""
    stmt = (
        select(
            InvestigationSession.id,
            InvestigationSession.name,
            InvestigationSession.created_at,
            func.count(webhook_sessions.c.webhook_id).label("count"),
        )
        .outerjoin(webhook_sessions)
        .group_by(InvestigationSession.id, InvestigationSession.name, InvestigationSession.created_at)
        .order_by(InvestigationSession.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    return SessionListResponse(
        sessions=[
            SessionResponse(
                id=r.id,
                name=r.name,
                webhook_count=r.count or 0,
                created_at=r.created_at.isoformat(),
            )
            for r in rows
        ]
    )


@router.post("", response_model=SessionResponse, status_code=201)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
) -> SessionResponse:
    """セッションを作成"""
    session = InvestigationSession(name=body.name)
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return SessionResponse(
        id=session.id,
        name=session.name,
        webhook_count=0,
        created_at=session.created_at.isoformat(),
    )


@router.post("/{session_id}/webhooks/{webhook_id}", status_code=204)
async def add_webhook_to_session(
    session_id: UUID,
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Webhook をセッションに紐づける"""
    stmt = select(InvestigationSession).where(InvestigationSession.id == session_id)
    sess = (await db.execute(stmt)).scalar_one_or_none()
    if not sess:
        raise HTTPException(404, "Session not found")
    stmt = select(Webhook).where(Webhook.id == webhook_id)
    webhook = (await db.execute(stmt)).scalar_one_or_none()
    if not webhook:
        raise HTTPException(404, "Webhook not found")
    existing = await db.execute(
        select(webhook_sessions).where(
            webhook_sessions.c.session_id == session_id,
            webhook_sessions.c.webhook_id == webhook_id,
        )
    )
    if existing.first() is None:
        await db.execute(
            webhook_sessions.insert().values(
                webhook_id=webhook_id, session_id=session_id
            )
        )


@router.delete("/{session_id}/webhooks/{webhook_id}", status_code=204)
async def remove_webhook_from_session(
    session_id: UUID,
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
) -> None:
    """Webhook をセッションから外す"""
    await db.execute(
        webhook_sessions.delete().where(
            webhook_sessions.c.session_id == session_id,
            webhook_sessions.c.webhook_id == webhook_id,
        )
    )
