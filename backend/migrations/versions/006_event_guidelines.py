"""Add guidelines column to events

Revision ID: 006_event_guidelines
Revises: 005_cashfree_and_form_image
Create Date: 2026-11-25 00:25:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

revision: str = "006_event_guidelines"
down_revision: Union[str, None] = "005_cashfree_and_form_image"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE events
            ADD COLUMN IF NOT EXISTS guidelines JSONB
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE events
            DROP COLUMN IF EXISTS guidelines
    """)
