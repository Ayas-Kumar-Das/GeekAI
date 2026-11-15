"""Participants API — CRUD, photo/QR uploads, search/filter."""

from __future__ import annotations

import logging
import shutil
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.deps import get_current_user, get_db
from app.models.models import (
    Attendance,
    AttendanceMethod,
    FaceEmbedding,
    Participant,
    ParticipantCategory,
    User,
)
from app.schemas.schemas import AttendanceOut, ParticipantDetail, ParticipantList, ParticipantOut
from app.services.email_service import send_qr_email
from app.services.embedding_service import generate_embedding
from app.services.qr_service import generate_qr_code

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/participants", tags=["participants"])


@router.post("/", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
async def register_participant(
    background_tasks: BackgroundTasks,
    name: str = Form(...),
    email: str = Form(...),
    phone: Optional[str] = Form(None),
    institution: Optional[str] = Form(None),
    category: ParticipantCategory = Form(ParticipantCategory.OTHER),
    photo: Optional[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    """Register a new participant.

    Accepts multipart form data with an optional photo upload.
    Generates QR code, face embedding (if photo provided), and sends confirmation email.
    """
    # Check duplicate
    existing = await db.execute(select(Participant).where(Participant.email == email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Participant with this email already exists")

    participant = Participant(
        name=name,
        email=email,
        phone=phone,
        institution=institution,
        category=category,
    )
    db.add(participant)
    await db.flush()
    await db.refresh(participant)

    # Save photo
    photo_path: Optional[str] = None
    if photo and photo.filename:
        photo_dir = settings.photos_dir
        filename = f"{participant.id}.jpg"
        filepath = photo_dir / filename
        with open(filepath, "wb") as f:
            content = await photo.read()
            f.write(content)
        participant.photo_url = f"uploads/photos/{filename}"
        photo_path = str(filepath)

    # Generate QR code
    qr_rel = generate_qr_code(participant.id, participant.name)
    participant.qr_code_url = qr_rel

    await db.flush()
    await db.refresh(participant)

    # Generate face embedding (if photo provided)
    if photo_path:
        embedding_vec = generate_embedding(photo_path)
        face_emb = FaceEmbedding(
            participant_id=participant.id,
            embedding=embedding_vec,
        )
        db.add(face_emb)
        await db.flush()

    # Send email with QR in background
    qr_abs_path = str(settings.qrcodes_dir / f"{participant.id}.png")
    background_tasks.add_task(send_qr_email, participant.email, participant.name, qr_abs_path)

    return participant


@router.get("/", response_model=ParticipantList)
async def list_participants(
    search: Optional[str] = None,
    category: Optional[ParticipantCategory] = None,
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
):
    query = select(Participant)
    count_query = select(func.count()).select_from(Participant)

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
    total = total_result.scalar()

    query = query.order_by(Participant.registered_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = result.scalars().all()

    return ParticipantList(total=total, items=[ParticipantOut.model_validate(p) for p in items])


@router.get("/{participant_id}", response_model=ParticipantDetail)
async def get_participant(participant_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Participant)
        .where(Participant.id == participant_id)
        .options(selectinload(Participant.attendances))
    )
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
        attendances=attendances,
    )


@router.get("/{participant_id}/photo")
async def get_participant_photo(participant_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.id == participant_id))
    participant = result.scalar_one_or_none()
    if not participant or not participant.photo_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo not found")

    filepath = Path(participant.photo_url)
    if not filepath.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Photo file missing")
    return FileResponse(filepath, media_type="image/jpeg")


@router.get("/{participant_id}/qrcode")
async def get_participant_qrcode(participant_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Participant).where(Participant.id == participant_id))
    participant = result.scalar_one_or_none()
    if not participant or not participant.qr_code_url:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code not found")

    filepath = Path(participant.qr_code_url)
    if not filepath.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="QR code file missing")
    return FileResponse(filepath, media_type="image/png")
