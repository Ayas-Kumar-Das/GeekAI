"""Add Cashfree credentials and registration form image to events

Revision ID: 005_cashfree_and_form_image
Revises: 004_super_admin_form_builder
Create Date: 2026-11-24 20:45:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "005_cashfree_and_form_image"
down_revision: Union[str, None] = "004_super_admin_form_builder"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("""
        ALTER TABLE events
            ADD COLUMN IF NOT EXISTS cashfree_enabled BOOLEAN NOT NULL DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS cashfree_app_id VARCHAR(255),
            ADD COLUMN IF NOT EXISTS cashfree_secret_key VARCHAR(512),
            ADD COLUMN IF NOT EXISTS cashfree_env VARCHAR(20) NOT NULL DEFAULT 'sandbox',
            ADD COLUMN IF NOT EXISTS form_image_url VARCHAR(512)
    """)


def downgrade() -> None:
    op.execute("""
        ALTER TABLE events
            DROP COLUMN IF EXISTS cashfree_enabled,
            DROP COLUMN IF EXISTS cashfree_app_id,
            DROP COLUMN IF EXISTS cashfree_secret_key,
            DROP COLUMN IF EXISTS cashfree_env,
            DROP COLUMN IF EXISTS form_image_url
    """)
