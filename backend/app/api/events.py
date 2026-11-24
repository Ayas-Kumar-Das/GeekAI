"""Events API — CRUD for multi-event platform."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_admin, get_db
from app.models.models import Coupon, Event, Session
from app.schemas.schemas import EventOut, SessionOut, ValidateCouponRequest, ValidateCouponResponse

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


@router.post("/{slug}/validate-coupon", response_model=ValidateCouponResponse)
async def validate_coupon(
    slug: str,
    body: ValidateCouponRequest,
    db: AsyncSession = Depends(get_db),
):
    """Validate a coupon code for an event to bypass payment."""
    event_result = await db.execute(select(Event).where(Event.slug == slug))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    cleaned_code = body.code.strip().upper()
    coupon_result = await db.execute(
        select(Coupon).where(
            Coupon.event_id == event.id,
            func.upper(Coupon.code) == cleaned_code,
        )
    )
    coupon = coupon_result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=400, detail="Invalid coupon code for this event")

    if not coupon.is_active:
        raise HTTPException(status_code=400, detail="This coupon code is inactive or expired")

    if coupon.used_count >= coupon.max_uses:
        raise HTTPException(status_code=400, detail="This coupon has already reached its maximum usage limit (one-time coupon already used)")

    return ValidateCouponResponse(
        valid=True,
        code=coupon.code,
        message=f"Coupon {coupon.code} applied! Registration fee is waived.",
        event_name=event.name,
    )


@router.get("/{slug}/registration-form")
async def get_registration_form(slug: str, db: AsyncSession = Depends(get_db)):
    """Return the published registration form schema for an event.

    Returns 200 with the form schema if the event has a custom form schema,
    or 204 (no content) if the event uses the standard registration form.
    """
    event_result = await db.execute(select(Event).where(Event.slug == slug))
    event = event_result.scalar_one_or_none()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if not event.registration_form_schema:
        # No custom form — frontend uses static form
        return {
            "has_custom_form": False,
            "event_id": event.id,
            "schema": None,
        }

    return {
        "has_custom_form": True,
        "event_id": event.id,
        "schema": event.registration_form_schema,
        "version": event.registration_form_version,
    }

