"""Webhook 関連の ORM モデル"""
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Table, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base

# Webhook と InvestigationSession の多対多の中間テーブル
webhook_sessions = Table(
    "webhook_sessions",
    Base.metadata,
    Column("webhook_id", PG_UUID(as_uuid=True), ForeignKey("webhooks.id", ondelete="CASCADE")),
    Column("session_id", PG_UUID(as_uuid=True), ForeignKey("investigation_sessions.id", ondelete="CASCADE")),
)


class Webhook(Base):
    """受信した Webhook の記録"""

    __tablename__ = "webhooks"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    source: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    event_type: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    group_key: Mapped[str] = mapped_column(String(256), nullable=False, index=True)
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    schema_drift: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    analyses: Mapped[list["WebhookAnalysis"]] = relationship(
        "WebhookAnalysis",
        back_populates="webhook",
        cascade="all, delete-orphan",
    )
    sessions: Mapped[list["InvestigationSession"]] = relationship(
        "InvestigationSession",
        secondary=webhook_sessions,
        back_populates="webhooks",
    )


class InvestigationSession(Base):
    """調査セッション（タグ/ラベル）"""

    __tablename__ = "investigation_sessions"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    webhooks: Mapped[list["Webhook"]] = relationship(
        "Webhook",
        secondary=webhook_sessions,
        back_populates="sessions",
    )


class WebhookAnalysis(Base):
    """Webhook の AI 分析結果"""

    __tablename__ = "webhook_analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    webhook_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("webhooks.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    field_descriptions: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    analyzed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    webhook: Mapped["Webhook"] = relationship("Webhook", back_populates="analyses")
