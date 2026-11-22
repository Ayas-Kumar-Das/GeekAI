"""Multi-event architecture + Cashfree payment fields

Revision ID: 002_multi_event_payment
Revises: 001_initial
Create Date: 2024-01-02 00:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from datetime import datetime, timezone

revision: str = "002_multi_event_payment"
down_revision: Union[str, None] = "001_initial"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create events table
    op.create_table(
        "events",
        sa.Column("id", sa.Integer, primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("slug", sa.String(100), unique=True, nullable=False, index=True),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("tagline", sa.String(255), nullable=True),
        sa.Column("logo_url", sa.String(512), nullable=True),
        sa.Column("banner_url", sa.String(512), nullable=True),
        sa.Column("registration_fee", sa.Integer, nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.text("true")),
        sa.Column("event_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("venue", sa.String(255), nullable=True),
        sa.Column("registration_deadline", sa.DateTime(timezone=True), nullable=True),
        sa.Column("website", sa.String(512), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )

    # Add event_id to participants
    op.add_column("participants", sa.Column("event_id", sa.Integer, sa.ForeignKey("events.id"), nullable=True))
    op.create_index("ix_participants_event_id", "participants", ["event_id"])

    # Add payment fields to participants
    op.add_column("participants", sa.Column("payment_order_id", sa.String(255), nullable=True))
    op.add_column("participants", sa.Column("payment_status", sa.String(50), nullable=True, server_default="PENDING"))

    # Add event_id to sessions
    op.add_column("sessions", sa.Column("event_id", sa.Integer, sa.ForeignKey("events.id"), nullable=True))
    op.create_index("ix_sessions_event_id", "sessions", ["event_id"])

    # Insert OAIC event (id=1)
    op.execute("""
        INSERT INTO events (id, name, slug, description, tagline, logo_url, registration_fee, is_active, event_date, venue, website, created_at)
        VALUES (
            1,
            'Odisha AI Conference (OAIC)',
            'oaic',
            'Odisha AI Conference is a premier event bringing together AI researchers, practitioners, and students from across India to share knowledge, collaborate, and shape the future of artificial intelligence.',
            'Shaping the Future of AI in Odisha',
            'https://www.oaic.in/assets/images/logo.png',
            30000,
            true,
            '2026-02-15 09:00:00+05:30',
            'SOA University, Bhubaneswar, Odisha',
            'https://www.oaic.in',
            NOW()
        )
    """)

    # Set event_id=1 for all existing participants and sessions
    op.execute("UPDATE participants SET event_id = 1 WHERE event_id IS NULL")
    op.execute("UPDATE sessions SET event_id = 1 WHERE event_id IS NULL")
    op.execute("UPDATE participants SET payment_status = 'SUCCESS' WHERE payment_status IS NULL")


def downgrade() -> None:
    op.drop_index("ix_sessions_event_id", table_name="sessions")
    op.drop_column("sessions", "event_id")
    op.drop_column("participants", "payment_status")
    op.drop_column("participants", "payment_order_id")
    op.drop_index("ix_participants_event_id", table_name="participants")
    op.drop_column("participants", "event_id")
    op.drop_table("events")
