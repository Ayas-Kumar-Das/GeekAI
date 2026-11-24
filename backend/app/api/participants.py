"""Participants API — registration, photo/QR, search/filter."""

from __future__ import annotations

import json
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
from sqlalchemy import func, or_, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.deps import get_current_admin, get_current_staff, get_db
from app.models.models import (
    Attendance,
    Coupon,
    Event,
    FaceEmbedding,
    Participant,
    ParticipantCategory,
    User,
)
from app.schemas.schemas import AttendanceOut, ParticipantDetail, ParticipantList, ParticipantOut, ParticipantUpdate
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
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    institution: Optional[str] = Form(None),
    category: ParticipantCategory = Form(ParticipantCategory.OTHER),
    photo: Optional[UploadFile] = File(None),
    event_id: Optional[int] = Form(None),
    payment_order_id: Optional[str] = Form(None),
    payment_status: Optional[str] = Form("PENDING"),
    coupon_code: Optional[str] = Form(None),
    source: Optional[str] = Form("ONLINE"),
    custom_responses: Optional[str] = Form(None),  # JSON string of {field_id: value}
    db: AsyncSession = Depends(get_db),
):
    """Public participant registration.
    
    Supports dynamic schema forms, paid events, free events, coupon code bypass, and payment recovery reconciliation.
    """
    target_event_id = event_id or 1
    clean_source = (source or "ONLINE").strip().upper()[:9]

    # Parse custom_responses JSON string if provided
    parsed_custom_responses = None
    if custom_responses and custom_responses.strip():
        try:
            parsed_custom_responses = json.loads(custom_responses)
        except (json.JSONDecodeError, ValueError):
            logger.warning("Failed to parse custom_responses JSON: %s", custom_responses)

    resolved_name = (name or "").strip()
    resolved_email = (email or "").strip().lower()
    resolved_phone = (phone or "").strip() if phone else None
    resolved_institution = (institution or "").strip() if institution else None
    resolved_category = category

    if parsed_custom_responses and isinstance(parsed_custom_responses, dict):
        if not resolved_name:
            for k, v in parsed_custom_responses.items():
                k_lower = k.lower()
                if isinstance(v, str) and v.strip() and any(x in k_lower for x in ["name", "full_name", "attendee", "participant"]):
                    resolved_name = v.strip()
                    break
        if not resolved_email:
            for k, v in parsed_custom_responses.items():
                k_lower = k.lower()
                if isinstance(v, str) and "@" in v and any(x in k_lower for x in ["email", "mail"]):
                    resolved_email = v.strip().lower()
                    break
        if not resolved_phone:
            for k, v in parsed_custom_responses.items():
                k_lower = k.lower()
                if isinstance(v, str) and any(x in k_lower for x in ["phone", "mobile", "contact"]):
                    resolved_phone = v.strip()
                    break
        if not resolved_institution:
            for k, v in parsed_custom_responses.items():
                k_lower = k.lower()
                if isinstance(v, str) and any(x in k_lower for x in ["institution", "college", "org", "university", "company"]):
                    resolved_institution = v.strip()
                    break

    if not resolved_name:
        resolved_name = "Participant"

    if not resolved_email:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Email is required for registration",
        )

    clean_email = resolved_email

    # 1. Idempotency: If this payment_order_id is already recorded, return existing participant
    if payment_order_id and payment_order_id.strip():
        existing_order_res = await db.execute(
            select(Participant).where(
                Participant.payment_order_id == payment_order_id.strip(),
                Participant.event_id == target_event_id,
            )
        )
        existing_by_order = existing_order_res.scalar_one_or_none()
        if existing_by_order:
            logger.info("Participant already registered with order_id %s, returning record", payment_order_id)
            return existing_by_order

    # 2. Check existing participant with same email in target event
    existing_res = await db.execute(
        select(Participant).where(
            func.lower(Participant.email) == clean_email,
            Participant.event_id == target_event_id,
        )
    )
    existing_participant = existing_res.scalar_one_or_none()
    if existing_participant and existing_participant.payment_status == "SUCCESS":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A participant with this email is already registered and confirmed for this event.",
        )

    final_payment_status = payment_status or "PENDING"
    final_payment_order_id = payment_order_id.strip() if payment_order_id else None
    final_coupon_code = None

    # 3. Handle coupon code bypass
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
    elif final_payment_order_id and not final_payment_order_id.startswith("COUPON_"):
        # 4. Verify with Cashfree if configured
        if settings.cashfree_configured:
            from app.api.payments import check_cashfree_order_paid
            is_paid, cf_data = await check_cashfree_order_paid(final_payment_order_id)
            if is_paid:
                final_payment_status = "SUCCESS"
            else:
                logger.warning("Order %s was not marked as PAID on Cashfree", final_payment_order_id)
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment has not been completed on Cashfree for this order.",
                )
        else:
            final_payment_status = "SUCCESS"
    else:
        # Check if event is free
        evt_res = await db.execute(select(Event).where(Event.id == target_event_id))
        evt = evt_res.scalar_one_or_none()
        if evt and evt.registration_fee == 0:
            final_payment_status = "SUCCESS"

    participant_status = "CONFIRMED" if final_payment_status == "SUCCESS" else "PENDING"

    # 5. Create or Update Participant record
    if existing_participant:
        # Reconcile existing pending participant
        participant = existing_participant
        participant.name = resolved_name
        participant.phone = resolved_phone
        participant.institution = resolved_institution
        participant.category = resolved_category
        participant.source = clean_source
        participant.status = participant_status
        participant.payment_order_id = final_payment_order_id
        participant.payment_status = final_payment_status
        participant.coupon_code = final_coupon_code
        if parsed_custom_responses is not None:
            participant.custom_responses = parsed_custom_responses
    else:
        participant = Participant(
            name=resolved_name,
            email=clean_email,
            phone=resolved_phone,
            institution=resolved_institution,
            category=resolved_category,
            event_id=target_event_id,
            source=clean_source,
            status=participant_status,
            embedding_status="PENDING",
            payment_order_id=final_payment_order_id,
            payment_status=final_payment_status,
            coupon_code=final_coupon_code,
            custom_responses=parsed_custom_responses,
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
        participant.embedding_status = "COMPLETED"
        await db.flush()
    else:
        participant.embedding_status = "NOT_REQUIRED"
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


def resolve_media_path(stored_path: str | None) -> Path | None:
    """Resolve a relative or absolute stored media path to a valid existing Path on disk."""
    if not stored_path:
        return None
    cleaned = stored_path.strip().lstrip("/")
    
    # 1. Direct path from current working directory
    p_cwd = Path(cleaned)
    if p_cwd.exists() and p_cwd.is_file():
        return p_cwd

    # 2. Inside settings.UPLOAD_DIR
    upload_dir = Path(settings.UPLOAD_DIR)
    p_upload = upload_dir / cleaned
    if p_upload.exists() and p_upload.is_file():
        return p_upload

    # 3. Strip 'uploads/' if upload_dir is already 'uploads'
    if cleaned.startswith("uploads/"):
        sub = cleaned[len("uploads/"):]
        p_sub = upload_dir / sub
        if p_sub.exists() and p_sub.is_file():
            return p_sub

    # 4. Check absolute path as provided
    p_abs = Path(stored_path)
    if p_abs.exists() and p_abs.is_file():
        return p_abs

    return None


@router.get("/{participant_id}/photo")
async def get_participant_photo(
    participant_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_current_staff),
):
    """Serve the participant photo through an authenticated handler with robust path resolution."""
    query = select(Participant).where(Participant.id == participant_id)
    if _staff.event_id:
        query = query.where(Participant.event_id == _staff.event_id)

    result = await db.execute(query)
    participant = result.scalar_one_or_none()
    if not participant or not participant.photo_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    filepath = resolve_media_path(participant.photo_url)
    if not filepath or not filepath.exists():
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

    filepath = resolve_media_path(participant.qr_code_url)
    if not filepath or not filepath.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code file missing")
    return FileResponse(filepath, media_type="image/png")


# ---------------------------------------------------------------------------
# Edit / Delete (admin-only operations)
# ---------------------------------------------------------------------------

@router.patch("/{participant_id}", response_model=ParticipantOut)
async def update_participant(
    participant_id: int,
    body: ParticipantUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_current_staff),
):
    """Update mutable participant fields. Available to authorized event operators / admin."""
    query = select(Participant).where(Participant.id == participant_id)
    if _staff.event_id:
        query = query.where(Participant.event_id == _staff.event_id)

    result = await db.execute(query)
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    before_snapshot = {
        "name": participant.name,
        "email": participant.email,
        "phone": participant.phone,
        "institution": participant.institution,
        "category": participant.category.value if hasattr(participant.category, "value") else str(participant.category),
        "payment_status": participant.payment_status,
        "status": participant.status,
    }

    # Handle email change with uniqueness check
    if body.email is not None:
        clean_email = body.email.strip().lower()
        if clean_email != participant.email.lower():
            dup_stmt = select(Participant).where(
                func.lower(Participant.email) == clean_email,
                Participant.event_id == participant.event_id,
                Participant.id != participant.id,
            )
            dup_res = await db.execute(dup_stmt)
            if dup_res.scalar_one_or_none():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="A participant with this email is already registered in this event.",
                )
            participant.email = clean_email

    update_data = body.model_dump(exclude_unset=True)
    # email is already handled
    update_data.pop("email", None)

    for field, value in update_data.items():
        if value is not None:
            setattr(participant, field, value)

    await db.commit()
    await db.refresh(participant)

    after_snapshot = {
        "name": participant.name,
        "email": participant.email,
        "phone": participant.phone,
        "institution": participant.institution,
        "category": participant.category.value if hasattr(participant.category, "value") else str(participant.category),
        "payment_status": participant.payment_status,
        "status": participant.status,
    }

    await _audit(
        db,
        request,
        "PARTICIPANT_UPDATE",
        _staff,
        entity_id=str(participant_id),
        before=before_snapshot,
        after=after_snapshot,
    )

    return ParticipantOut.model_validate(participant)


@router.delete("/{participant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_participant(
    participant_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
    _staff: User = Depends(get_current_admin),
):
    """Permanently delete a participant. Admin-only. Preserves data integrity by cascading cleanly."""
    query = select(Participant).where(Participant.id == participant_id)
    if _staff.event_id:
        query = query.where(Participant.event_id == _staff.event_id)

    result = await db.execute(query)
    participant = result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    before_snapshot = {
        "name": participant.name,
        "email": participant.email,
        "event_id": participant.event_id,
    }

    # Clean up foreign key references that might be RESTRICT (qr_tokens, email_outbox)
    try:
        await db.execute(text("DELETE FROM qr_tokens WHERE participant_id = :pid"), {"pid": participant_id})
        await db.execute(text("DELETE FROM email_outbox WHERE participant_id = :pid"), {"pid": participant_id})
    except Exception as e:
        logger.warning("Error cleaning dependent token/outbox rows: %s", e)

    # Clean up uploaded media files
    for file_path in [participant.photo_url, participant.qr_code_url]:
        if file_path:
            fp = resolve_media_path(file_path)
            if fp and fp.exists():
                try:
                    fp.unlink()
                except OSError:
                    logger.warning("Could not delete file %s", file_path)

    await db.delete(participant)
    await db.commit()

    await _audit(
        db,
        request,
        "PARTICIPANT_DELETE",
        _staff,
        entity_id=str(participant_id),
        before=before_snapshot,
        after={"deleted": True},
    )

