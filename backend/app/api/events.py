"""Events API — CRUD for multi-event platform."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_admin, get_db
from app.models.models import Event, Session
from app.schemas.schemas import EventOut, SessionOut

router = APIRouter(prefix="/api/events", tags=["events"])


@router.get("/", response_model=list[EventOut])
async def list_events(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.is_active == True).order_by(Event.id))
    return result.scalars().all()


@router.get("/{slug}", response_model=EventOut)
async def get_event(slug: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Event).where(Event.slug == slug))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.get("/{slug}/sessions", response_model=list[SessionOut])
async def get_event_sessions(slug: str, db: AsyncSession = Depends(get_db)):
    # Get event first
    event_result = await db.execute(select(Event).where(Event.slug == slug))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Get sessions for this event
    result = await db.execute(
        select(Session)
        .where(Session.event_id == event.id)
        .order_by(Session.start_time)
    )
    return result.scalars().all()
