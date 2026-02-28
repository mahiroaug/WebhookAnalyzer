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
    analyzed: bool
    has_drift: bool = False
    sequence_index: int | None = None
    http_method: str | None = None
    remote_ip: str | None = None


class WebhookListResponse(BaseModel):
    """ページング付き一覧のレスポンス"""

    items: list[WebhookListItem]
    total: int


class WebhookDetail(BaseModel):
    """詳細（payload 含む）"""

    id: UUID
    source: str
    event_type: str
    group_key: str
    payload: dict
    received_at: datetime
    schema_drift: dict | None = None
    sequence_index: int | None = None
    http_method: str | None = None
    remote_ip: str | None = None
    request_headers: dict | None = None


class AdjacentResponse(BaseModel):
    """前後 Webhook の ID（US-110）"""

    prev_id: UUID | None = None
    next_id: UUID | None = None


class StatsResponse(BaseModel):
    """統計 API レスポンス"""

    by_source: dict[str, int]
    by_event_type: dict[str, int]


class EventTypeGroup(BaseModel):
    """event_type 別グルーピングの1件"""

    event_type: str
    count: int
    sample: WebhookListItem
    is_known: bool = True


class EventTypeGroupResponse(BaseModel):
    """event_type 別グルーピングのレスポンス"""

    groups: list[EventTypeGroup]


class SchemaField(BaseModel):
    """スキーマ推定の1フィールド"""

    path: str
    type: str
    occurrence_rate: float
    required: bool


class SchemaEstimateResponse(BaseModel):
    """スキーマ推定のレスポンス"""

    event_type: str
    source: str | None
    total_samples: int
    fields: list[SchemaField]


class FieldTemplateItem(BaseModel):
    """フィールド辞書テンプレートの1エントリ"""

    path: str
    description: str
    notes: str | None = None
    reference_url: str | None = None


class FieldTemplateResponse(BaseModel):
    """フィールド辞書テンプレート API のレスポンス"""

    source: str
    event_type: str
    fields: list[FieldTemplateItem]
