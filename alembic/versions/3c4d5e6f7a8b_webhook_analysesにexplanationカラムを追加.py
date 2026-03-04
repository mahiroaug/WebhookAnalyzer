"""webhook_analyses に explanation カラムを追加

Revision ID: 3c4d5e6f7a8b
Revises: 2b3c4d5e6f7a
Create Date: 2026-02-28

US-127: 個別解説を DB のみに保存（YAML には書き出さない）
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "3c4d5e6f7a8b"
down_revision: Union[str, Sequence[str], None] = "2b3c4d5e6f7a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "webhook_analyses",
        sa.Column("explanation", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("webhook_analyses", "explanation")
