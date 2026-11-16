"""Attendance API — record, query, validate QR."""

from __future__ import annotations

import json
import os
import tempfile
from typing import Optional

import numpy as np
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy import and_, func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_current_user, get_db
from app.models.models import Attendance, AttendanceMethod, FaceEmbedding, Participant, Session, User
from app.schemas.schemas import (
    AttendanceCreate,
    AttendanceOut,
    AttendanceStats,
    FaceMatchResponse,
    ParticipantOut,
    QRValidateRequest,
    QRValidateResponse,
)
from app.services.embedding_service import generate_embedding

router = APIRouter(prefix="/api/attendance", tags=["attendance"])


@router.post("/", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
async def record_attendance(
    body: AttendanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Record attendance for a participant. Prevents duplicates."""
    # Verify participant exists
    p_result = await db.execute(select(Participant).where(Participant.id == body.participant_id))
    participant = p_result.scalar_one_or_none()
    if not participant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Participant not found")

    # Verify session exists (if provided)
    if body.session_id is not None:
        s_result = await db.execute(select(Session).where(Session.id == body.session_id))
        if not s_result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    # Check for duplicate
    if body.session_id is not None:
        dup_query = select(Attendance).where(
            and_(
                Attendance.participant_id == body.participant_id,
                Attendance.session_id == body.session_id,
            )
        )
    else:
        dup_query = select(Attendance).where(
            and_(
                Attendance.participant_id == body.participant_id,
                Attendance.session_id.is_(None),
            )
        )

    dup_result = await db.execute(dup_query)
    if dup_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance already recorded for this participant" + (
                f" in session {body.session_id}" if body.session_id else " at event level"
            ),
        )

    attendance = Attendance(
        participant_id=body.participant_id,
        session_id=body.session_id,
        method=body.method,
        marked_by=current_user.id,
    )
    db.add(attendance)
    await db.flush()
    await db.refresh(attendance)

    return AttendanceOut(
        id=attendance.id,
        participant_id=attendance.participant_id,
        session_id=attendance.session_id,
        method=attendance.method,
        marked_by=attendance.marked_by,
        marked_at=attendance.marked_at,
        participant_name=participant.name,
    )


@router.get("/event", response_model=list[AttendanceOut])
async def event_attendance(db: AsyncSession = Depends(get_db)):
    """List all event-level attendance (session_id IS NULL)."""
    result = await db.execute(
        select(Attendance, Participant.name)
        .join(Participant, Attendance.participant_id == Participant.id)
        .where(Attendance.session_id.is_(None))
        .order_by(Attendance.marked_at.desc())
    )
    rows = result.all()
    return [
        AttendanceOut(
            id=a.id,
            participant_id=a.participant_id,
            session_id=a.session_id,
            method=a.method,
            marked_by=a.marked_by,
            marked_at=a.marked_at,
            participant_name=name,
        )
        for a, name in rows
    ]


@router.get("/session/{session_id}", response_model=list[AttendanceOut])
async def session_attendance(session_id: int, db: AsyncSession = Depends(get_db)):
    """List all attendance records for a specific session."""
    # Verify session
    s_result = await db.execute(select(Session).where(Session.id == session_id))
    if not s_result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    result = await db.execute(
        select(Attendance, Participant.name, Session.name)
        .join(Participant, Attendance.participant_id == Participant.id)
        .outerjoin(Session, Attendance.session_id == Session.id)
        .where(Attendance.session_id == session_id)
        .order_by(Attendance.marked_at.desc())
    )
    rows = result.all()
    return [
        AttendanceOut(
            id=a.id,
            participant_id=a.participant_id,
            session_id=a.session_id,
            method=a.method,
            marked_by=a.marked_by,
            marked_at=a.marked_at,
            participant_name=p_name,
            session_name=s_name,
        )
        for a, p_name, s_name in rows
    ]


@router.get("/stats", response_model=AttendanceStats)
async def attendance_stats(db: AsyncSession = Depends(get_db)):
    """Overall attendance statistics."""
    total_p = (await db.execute(select(func.count()).select_from(Participant))).scalar()
    total_checked = (
        await db.execute(
            select(func.count(func.distinct(Attendance.participant_id))).select_from(Attendance)
        )
    ).scalar()
    total_sessions = (await db.execute(select(func.count()).select_from(Session))).scalar()

    # By method
    method_result = await db.execute(
        select(Attendance.method, func.count())
        .group_by(Attendance.method)
    )
    by_method = {row[0].value: row[1] for row in method_result.all()}

    # By session
    session_result = await db.execute(
        select(Session.id, Session.name, func.count(Attendance.id))
        .outerjoin(Attendance, Attendance.session_id == Session.id)
        .group_by(Session.id, Session.name)
        .order_by(Session.start_time)
    )
    by_session = [
        {"session_id": sid, "session_name": sname, "count": cnt}
        for sid, sname, cnt in session_result.all()
    ]

    return AttendanceStats(
        total_participants=total_p,
        total_checked_in=total_checked,
        total_sessions=total_sessions,
        attendance_by_method=by_method,
        attendance_by_session=by_session,
    )


@router.post("/validate-qr", response_model=QRValidateResponse)
async def validate_qr(body: QRValidateRequest, db: AsyncSession = Depends(get_db)):
    """Validate a participant from scanned QR code data."""
    result = await db.execute(select(Participant).where(Participant.id == body.participant_id))
    participant = result.scalar_one_or_none()

    if not participant:
        return QRValidateResponse(valid=False, message="Participant not found")

    if participant.name != body.name:
        return QRValidateResponse(valid=False, message="QR data does not match records")

    return QRValidateResponse(
        valid=True,
        participant=ParticipantOut.model_validate(participant),
        message="Participant verified successfully",
    )


@router.post("/face-match", response_model=FaceMatchResponse)
async def match_face(
    photo: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Identify a participant from an uploaded face snapshot and check attendance status.

    Reuses the InsightFace embedding generator and cosine similarity matching.
    Returns matched participant info, similarity score, and whether event attendance
    has already been marked.
    """
    # Save uploaded photo to a temporary file
    suffix = os.path.splitext(photo.filename or "")[1] or ".jpg"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        content = await photo.read()
        tmp.write(content)

    try:
        query_vec = generate_embedding(tmp_path)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)

    query_arr = np.array(query_vec, dtype=np.float32)
    query_norm = np.linalg.norm(query_arr)
    if query_norm == 0 or np.all(query_arr == 0):
        return FaceMatchResponse(
            matched=False,
            message="No face detected in the photo. Please ensure face is centered and clearly lit.",
        )

    # Normalize query vector
    query_unit = query_arr / query_norm

    # Load stored embeddings with participant details
    result = await db.execute(
        select(FaceEmbedding).options(selectinload(FaceEmbedding.participant))
    )
    embeddings = result.scalars().all()

    if not embeddings:
        return FaceMatchResponse(
            matched=False,
            message="No participant face embeddings available in the database.",
        )

    best_match: Optional[FaceEmbedding] = None
    best_sim = -1.0

    for emb in embeddings:
        if not emb.embedding or not emb.participant:
            continue
        vec = np.array(emb.embedding, dtype=np.float32)
        v_norm = np.linalg.norm(vec)
        if v_norm == 0:
            continue
        sim = float(np.dot(vec / v_norm, query_unit))
        if sim > best_sim:
            best_sim = sim
            best_match = emb

    MATCH_THRESHOLD = 0.40  # Consistent with face-checkin configuration
    if best_match is None or best_sim < MATCH_THRESHOLD:
        return FaceMatchResponse(
            matched=False,
            similarity=round(max(0.0, best_sim), 4),
            message="No registered participant matched above the similarity threshold.",
        )

    participant = best_match.participant

    # Check if event-level attendance is already recorded
    att_res = await db.execute(
        select(Attendance).where(
            and_(
                Attendance.participant_id == participant.id,
                Attendance.session_id.is_(None),
            )
        )
    )
    existing_att = att_res.scalar_one_or_none()

    return FaceMatchResponse(
        matched=True,
        participant=ParticipantOut.model_validate(participant),
        similarity=round(best_sim, 4),
        already_checked_in=existing_att is not None,
        message=f"Participant identified: {participant.name}",
    )

