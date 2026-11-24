"""Super Admin API — event CRUD and form builder endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_super_admin, get_db
from app.models.models import Event, Participant, User
from app.schemas.schemas import (
    EventCreate,
    EventUpdate,
    FormSchema,
    SuperAdminEventOut,
)

router = APIRouter(prefix="/api/super-admin", tags=["super-admin"])


# ---------------------------------------------------------------------------
# Dashboard stats
# ---------------------------------------------------------------------------

@router.get("/dashboard")
async def super_admin_dashboard(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    """Platform-wide stats for the Super Admin dashboard."""
    total_events = (await db.execute(select(func.count()).select_from(Event))).scalar()
    active_events = (await db.execute(select(func.count()).select_from(Event).where(Event.is_active == True))).scalar()
    published_events = (await db.execute(select(func.count()).select_from(Event).where(Event.is_published == True))).scalar()
    total_participants = (await db.execute(select(func.count()).select_from(Participant))).scalar()
    total_admins = (await db.execute(select(func.count()).select_from(User).where(User.role == "ADMIN"))).scalar()

    # Per-event participant counts
    per_event = (await db.execute(
        select(Event.id, Event.name, Event.slug, Event.is_active, Event.is_published,
               func.count(Participant.id).label("participant_count"))
        .outerjoin(Participant, Participant.event_id == Event.id)
        .group_by(Event.id)
        .order_by(Event.id)
    )).all()

    return {
        "total_events": total_events,
        "active_events": active_events,
        "published_events": published_events,
        "total_participants": total_participants,
        "total_admins": total_admins,
        "events": [
            {
                "id": r.id,
                "name": r.name,
                "slug": r.slug,
                "is_active": r.is_active,
                "is_published": r.is_published,
                "participant_count": r.participant_count,
            }
            for r in per_event
        ],
    }


# ---------------------------------------------------------------------------
# Event CRUD
# ---------------------------------------------------------------------------

@router.get("/events", response_model=list[SuperAdminEventOut])
async def list_all_events(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    """List all events (active and inactive) with participant counts."""
    rows = (await db.execute(
        select(Event, func.count(Participant.id).label("participant_count"))
        .outerjoin(Participant, Participant.event_id == Event.id)
        .group_by(Event.id)
        .order_by(Event.id)
    )).all()

    results = []
    for event, count in rows:
        out = SuperAdminEventOut.model_validate(event)
        out = out.model_copy(update={"participant_count": count})
        results.append(out)
    return results


@router.get("/events/{event_id}", response_model=SuperAdminEventOut)
async def get_event_detail(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    count = (await db.execute(
        select(func.count()).select_from(Participant).where(Participant.event_id == event_id)
    )).scalar()

    out = SuperAdminEventOut.model_validate(event)
    out = out.model_copy(update={"participant_count": count})
    return out


@router.post("/events", response_model=SuperAdminEventOut, status_code=status.HTTP_201_CREATED)
async def create_event(
    body: EventCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    # Check slug uniqueness
    existing = await db.execute(select(Event).where(Event.slug == body.slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Event slug already exists")

    event = Event(
        name=body.name,
        slug=body.slug,
        description=body.description,
        tagline=body.tagline,
        logo_url=body.logo_url,
        banner_url=body.banner_url,
        registration_fee=body.registration_fee,
        event_date=body.event_date,
        venue=body.venue,
        registration_deadline=body.registration_deadline,
        website=body.website,
        is_active=True,
        is_published=False,
    )
    db.add(event)
    await db.flush()
    await db.refresh(event)

    out = SuperAdminEventOut.model_validate(event)
    out = out.model_copy(update={"participant_count": 0})
    return out


@router.patch("/events/{event_id}", response_model=SuperAdminEventOut)
async def update_event(
    event_id: int,
    body: EventUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(event, field, value)

    await db.flush()
    await db.refresh(event)

    count = (await db.execute(
        select(func.count()).select_from(Participant).where(Participant.event_id == event_id)
    )).scalar()

    out = SuperAdminEventOut.model_validate(event)
    out = out.model_copy(update={"participant_count": count})
    return out


@router.delete("/events/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    await db.delete(event)
    await db.flush()


# ---------------------------------------------------------------------------
# Publish / Deactivate
# ---------------------------------------------------------------------------

@router.post("/events/{event_id}/publish", response_model=SuperAdminEventOut)
async def publish_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.is_published = True
    event.is_active = True
    await db.flush()
    await db.refresh(event)

    count = (await db.execute(
        select(func.count()).select_from(Participant).where(Participant.event_id == event_id)
    )).scalar()

    out = SuperAdminEventOut.model_validate(event)
    out = out.model_copy(update={"participant_count": count})
    return out


@router.post("/events/{event_id}/deactivate", response_model=SuperAdminEventOut)
async def deactivate_event(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    event.is_active = False
    event.is_published = False
    await db.flush()
    await db.refresh(event)

    count = (await db.execute(
        select(func.count()).select_from(Participant).where(Participant.event_id == event_id)
    )).scalar()

    out = SuperAdminEventOut.model_validate(event)
    out = out.model_copy(update={"participant_count": count})
    return out


# ---------------------------------------------------------------------------
# Form Builder
# ---------------------------------------------------------------------------

@router.get("/events/{event_id}/form-schema")
async def get_form_schema(
    event_id: int,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return {
        "event_id": event_id,
        "schema": event.registration_form_schema or {"fields": [], "version": 1},
        "version": event.registration_form_version,
        "is_published": event.is_published,
    }


@router.put("/events/{event_id}/form-schema")
async def save_form_schema(
    event_id: int,
    body: FormSchema,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    result = await db.execute(select(Event).where(Event.id == event_id))
    event = result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    schema_dict = body.model_dump()
    event.registration_form_schema = schema_dict
    event.registration_form_version = (event.registration_form_version or 1) + 1
    await db.flush()
    await db.refresh(event)

    return {
        "event_id": event_id,
        "schema": event.registration_form_schema,
        "version": event.registration_form_version,
        "is_published": event.is_published,
    }


# ---------------------------------------------------------------------------
# Admin User Management
# ---------------------------------------------------------------------------

@router.get("/admins")
async def list_admins(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_super_admin),
):
    """List all ADMIN users (not super admins)."""
    result = await db.execute(
        select(User, Event.name.label("event_name"))
        .outerjoin(Event, User.event_id == Event.id)
        .where(User.role == "ADMIN")
        .order_by(User.id)
    )
    rows = result.all()
    return [
        {
            "id": u.id,
            "email": u.email,
            "name": u.name,
            "role": u.role.value if hasattr(u.role, "value") else u.role,
            "is_active": u.is_active,
            "event_id": u.event_id,
            "event_name": event_name,
            "created_at": u.created_at.isoformat(),
        }
        for u, event_name in rows
    ]
