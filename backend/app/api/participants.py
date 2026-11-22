"""Participants API — registration, photo/QR, search/filter."""

from __future__ import annotations

import logging
from pathlib import Path
from typing import Optional

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Request,
    UploadFile,
    status,
)
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.deps import get_current_staff, get_db
from app.models.models import (
    Attendance,
    Coupon,
    Event,
    FaceEmbedding,
    Participant,
    ParticipantCategory,
    User,
)
from app.schemas.schemas import AttendanceOut, ParticipantDetail, ParticipantList, ParticipantOut
from app.services.audit import audit_log
from app.services.email_service import send_qr_email
from app.services.embedding_service import generate_embedding
from app.services.qr_service import generate_qr_code

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/participants", tags=["participants"])


async def _audit(
    db: AsyncSession,
    request: Request,
    action: str,
    actor: Optional[User] = None,
    *,
    entity: str = "participant",
    entity_id: str | None = None,
    before: dict | None = None,
    after: dict | None = None,
) -> None:
    await audit_log(
        db,
        action=action,
        actor_id=actor.id if actor else None,
        actor_role=actor.role.value if actor and hasattr(actor.role, "value") else (actor.role if actor else "ANONYMOUS"),
        entity=entity,
        entity_id=entity_id,
        before=before,
        after=after,
        ip=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        request_id=getattr(request.state, "request_id", None),
    )


@router.post("/", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
async def register_participant(
    background_tasks: BackgroundTasks,
    request: Request,
    name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    institution: Optional[str] = Form(None),
    category: ParticipantCategory = Form(ParticipantCategory.OTHER),
    photo: Optional[UploadFile] = File(None),
    event_id: Optional[int] = Form(None),
    payment_order_id: Optional[str] = Form(None),
    payment_status: Optional[str] = Form("PENDING"),
    coupon_code: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """Public participant registration.
    
    Supports paid events, free events, and coupon code bypass.
    """
    target_event_id = event_id or 1

    # Check duplicate email
    existing = await db.execute(select(Participant).where(Participant.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A participant with this email already exists",
        )

    final_payment_status = payment_status or "PENDING"
    final_payment_order_id = payment_order_id
    final_coupon_code = None

    # Handle coupon code bypass
    if coupon_code and coupon_code.strip():
        cleaned_coupon = coupon_code.strip().upper()
        c_stmt = select(Coupon).where(
            Coupon.event_id == target_event_id,
            func.upper(Coupon.code) == cleaned_coupon,
        )
        c_res = await db.execute(c_stmt)
        coupon = c_res.scalar_one_or_none()
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid coupon code for this event",
            )
        if not coupon.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This coupon code is inactive or expired",
            )
        if coupon.used_count >= coupon.max_uses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This coupon code has already reached its maximum usage limit",
            )

        coupon.used_count += 1
        final_coupon_code = coupon.code
        final_payment_status = "SUCCESS"
        final_payment_order_id = f"COUPON_{coupon.code}"
    else:
        # Check if event is free
        evt_res = await db.execute(select(Event).where(Event.id == target_event_id))
        evt = evt_res.scalar_one_or_none()
        if evt and evt.registration_fee == 0:
            final_payment_status = "SUCCESS"

    participant = Participant(
        name=name,
        email=email,
        phone=phone,
        institution=institution,
        category=category,
        event_id=target_event_id,
        payment_order_id=final_payment_order_id,
        payment_status=final_payment_status,
        coupon_code=final_coupon_code,
    )
    db.add(participant)
    await db.flush()
    await db.refresh(participant)

    photo_path: Optional[str] = None
    if photo and photo.filename:
        photo_dir = settings.photos_dir
        filename = f"{participant.id}.jpg"
        filepath = photo_dir / filename
        with open(filepath, "wb") as f:
            f.write(await photo.read())
        participant.photo_url = f"uploads/photos/{filename}"
        photo_path = str(filepath)

    qr_rel = generate_qr_code(participant.id, participant.name)
    participant.qr_code_url = qr_rel

    await db.flush()
    await db.refresh(participant)

    if photo_path:
        embedding_vec = generate_embedding(photo_path)
        face_emb = FaceEmbedding(
            participant_id=participant.id,
            embedding=embedding_vec,
        )
        db.add(face_emb)
        await db.flush()

    qr_abs_path = str(settings.qrcodes_dir / f"{participant.id}.png")
    background_tasks.add_task(send_qr_email, participant.email, participant.name, qr_abs_path)

    await _audit(
        db,
        request,
        "PARTICIPANT_REGISTERED",
        actor=None,
        entity_id=str(participant.id),
        after={
            "name": participant.name,
            "event_id": target_event_id,
            "payment_status": final_payment_status,
            "coupon_code": final_coupon_code,
        },
    )
    return participant


@router.get("/", response_model=ParticipantList)
async def list_participants(
    request: Request,
    search: Optional[str] = None,
    category: Optional[ParticipantCategory] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_current_staff),
):
    """List participants scoped to the staff member's event."""
    query = select(Participant)
    count_query = select(func.count()).select_from(Participant)

    if _staff.event_id:
        query = query.where(Participant.event_id == _staff.event_id)
        count_query = count_query.where(Participant.event_id == _staff.event_id)

    if search:
        pattern = f"%{search}%"
        filter_clause = or_(
            Participant.name.ilike(pattern),
            Participant.email.ilike(pattern),
        )
        query = query.where(filter_clause)
        count_query = count_query.where(filter_clause)

    if category:
        query = query.where(Participant.category == category)
        count_query = count_query.where(Participant.category == category)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    query = query.order_by(Participant.registered_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    await _audit(
        db,
        request,
        "PARTICIPANT_LIST_READ",
        _staff,
        after={"count": len(items), "event_id": _staff.event_id},
    )
    return ParticipantList(total=total, items=[ParticipantOut.model_validate(p) for p in items])


@router.get("/{participant_id}", response_model=ParticipantDetail)
async def get_participant(
    participant_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_current_staff),
):
    query = select(Participant).where(Participant.id == participant_id).options(selectinload(Participant.attendances))
    if _staff.event_id:
        query = query.where(Participant.event_id == _staff.event_id)

    result = await db.execute(query)
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    attendances = []
    for a in participant.attendances:
        attendances.append(
            AttendanceOut(
                id=a.id,
                participant_id=a.participant_id,
                session_id=a.session_id,
                method=a.method,
                marked_by=a.marked_by,
                marked_at=a.marked_at,
            )
        )

    await _audit(
        db,
        request,
        "PARTICIPANT_READ",
        _staff,
        entity_id=str(participant_id),
        after={"result": "found"},
    )
    return ParticipantDetail(
        id=participant.id,
        name=participant.name,
        email=participant.email,
        phone=participant.phone,
        institution=participant.institution,
        category=participant.category,
        photo_url=participant.photo_url,
        qr_code_url=participant.qr_code_url,
        registered_at=participant.registered_at,
        event_id=participant.event_id,
        payment_status=participant.payment_status,
        coupon_code=participant.coupon_code,
        attendances=attendances,
    )


@router.get("/{participant_id}/photo")
async def get_participant_photo(
    participant_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_current_staff),
):
    """Serve the participant photo through an authenticated handler."""
    query = select(Participant).where(Participant.id == participant_id)
    if _staff.event_id:
        query = query.where(Participant.event_id == _staff.event_id)

    result = await db.execute(query)
    participant = result.scalar_one_or_none()
    if not participant or not participant.photo_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    filepath = Path(participant.photo_url)
    if not filepath.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo file missing")

    await _audit(
        db,
        request,
        "PARTICIPANT_PHOTO_READ",
        _staff,
        entity_id=str(participant_id),
        after={"result": "served"},
    )
    return FileResponse(filepath, media_type="image/jpeg")


@router.get("/{participant_id}/qrcode")
async def get_participant_qrcode(
    participant_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_current_staff),
):
    query = select(Participant).where(Participant.id == participant_id)
    if _staff.event_id:
        query = query.where(Participant.event_id == _staff.event_id)

    result = await db.execute(query)
    participant = result.scalar_one_or_none()
    if not participant or not participant.qr_code_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code not found")

    filepath = Path(participant.qr_code_url)
    if not filepath.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code file missing")
    return FileResponse(filepath, media_type="image/png")
