"""AI 分析関連の Pydantic スキーマ"""
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class WebhookAnalysisResponse(BaseModel):
    """分析結果レスポンス"""

    id: UUID
    webhook_id: UUID
    summary: str | None
    field_descriptions: dict[str, str] | None
    explanation: str | None = None  # US-127: DB のみ、YAML には出さない
    analyzed_at: datetime
    from_definition_file: bool = False  # US-126: 定義ファイル由来なら True


class AnalyzeTriggerResponse(BaseModel):
    """POST /analyze のレスポンス"""

    id: UUID
    webhook_id: UUID
    summary: str | None
    field_descriptions: dict[str, str] | None
    explanation: str | None = None
    analyzed_at: datetime


class BatchAnalyzeRequest(BaseModel):
    """一括分析のリクエスト"""

    webhook_ids: list[UUID]


class BatchAnalyzeResponse(BaseModel):
    """一括分析のレスポンス"""

    total: int
    completed: int
    failed: int
