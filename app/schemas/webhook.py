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


class MatchedRule(BaseModel):
    """US-146: マッチした検知ルール"""

    id: str
    name: str


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
    matched_rules: list[MatchedRule] = []  # US-146
    is_read: bool = False  # US-160
    is_favorite: bool = False  # US-179


class WebhookListResponse(BaseModel):
    """ページング付き一覧のレスポンス"""

    items: list[WebhookListItem]
    total: int


class FavoriteToggleResponse(BaseModel):
    """US-179: お気に入りトグルのレスポンス"""

    is_favorite: bool


class ReclassifyResponse(BaseModel):
    """US-182: 一括再分類のレスポンス"""

    total: int
    reclassified: int
    unchanged: int


class ReplayRequest(BaseModel):
    """US-145: 再送先 URL"""

    target_url: str


class ReplayResponse(BaseModel):
    """US-145: 再送結果"""

    status_code: int
    elapsed_ms: float
    success: bool
    error: str | None = None


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
    matched_rules: list[MatchedRule] = []  # US-146


class AdjacentResponse(BaseModel):
    """前後 Webhook の ID（US-110）"""

    prev_id: UUID | None = None
    next_id: UUID | None = None


class StatsResponse(BaseModel):
    """統計 API レスポンス"""

    by_source: dict[str, int]
    by_event_type: dict[str, int]


class FilterOptionsResponse(BaseModel):
    """US-175: source/event_type フィルタ候補の相互連動用"""

    sources: list[str]
    event_types: list[str]


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
