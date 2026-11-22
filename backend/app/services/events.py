"""Active-event lookup."""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import Event


async def get_active_event_id(db: AsyncSession) -> int:
    result = await db.execute(select(Event.id).order_by(Event.id))
    event_id = result.scalar()
    return event_id or 1
