"""Webhook 関連の Pydantic スキーマ"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ClassificationResult:
    """分類結果（内部用）"""

    def __init__(self, source: str, event_type: str, group_key: str) -> None:
        self.source = source
        self.event_type = event_type
        self.group_key = group_key


class WebhookReceiveResponse(BaseModel):
    """POST /api/webhooks/receive のレスポンス"""

    id: UUID
    source: str
    event_type: str
    group_key: str


class WebhookListItem(BaseModel):
    """一覧の1件"""

    id: UUID
    source: str
    event_type: str
    group_key: str
    received_at: datetime


class WebhookDetail(BaseModel):
    """詳細（payload 含む）"""

    id: UUID
    source: str
    event_type: str
    group_key: str
    payload: dict
    received_at: datetime


class StatsResponse(BaseModel):
    """統計 API レスポンス"""

    by_source: dict[str, int]
    by_event_type: dict[str, int]
