"""Admin API — dashboard stats and data exports."""

from __future__ import annotations

import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_admin, get_db
from app.core.security import hash_password
from app.models.models import Attendance, Participant, ParticipantCategory, Session, User, UserRole
from app.schemas.schemas import DashboardStats, ParticipantOut, VolunteerCreate, VolunteerOut

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    total_participants = (await db.execute(select(func.count()).select_from(Participant))).scalar()
    total_sessions = (await db.execute(select(func.count()).select_from(Session))).scalar()
    total_attendance = (await db.execute(select(func.count()).select_from(Attendance))).scalar()

    event_checkins = (
        await db.execute(
            select(func.count()).select_from(Attendance).where(Attendance.session_id.is_(None))
        )
    ).scalar()

    # By category
    cat_result = await db.execute(
        select(Participant.category, func.count()).group_by(Participant.category)
    )
    by_category = {row[0].value: row[1] for row in cat_result.all()}

    # Recent registrations (last 10)
    recent_result = await db.execute(
        select(Participant).order_by(Participant.registered_at.desc()).limit(10)
    )
    recent = [ParticipantOut.model_validate(p) for p in recent_result.scalars().all()]

    return DashboardStats(
        total_participants=total_participants,
        total_sessions=total_sessions,
        total_attendance_records=total_attendance,
        event_checkins=event_checkins,
        participants_by_category=by_category,
        recent_registrations=recent,
    )


# ===== Volunteer Management =================================================

@router.get("/volunteers", response_model=list[VolunteerOut])
async def list_volunteers(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """List all volunteers with attendance counts."""
    stmt = (
        select(
            User,
            func.count(Attendance.id).label("attendance_count"),
        )
        .outerjoin(Attendance, Attendance.marked_by == User.id)
        .where(User.role == UserRole.VOLUNTEER)
        .group_by(User.id)
        .order_by(User.created_at.desc())
    )
    result = await db.execute(stmt)
    rows = result.all()
    return [
        VolunteerOut(
            id=u.id,
            email=u.email,
            name=u.name,
            role=u.role,
            is_active=u.is_active,
            created_at=u.created_at,
            attendance_count=count,
        )
        for u, count in rows
    ]


@router.post("/volunteers", response_model=VolunteerOut, status_code=status.HTTP_201_CREATED)
async def create_volunteer(
    body: VolunteerCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Admin adds a new volunteer with custom email and password."""
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email address already exists",
        )

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=UserRole.VOLUNTEER,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return VolunteerOut(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        attendance_count=0,
    )


@router.patch("/volunteers/{volunteer_id}/toggle-status", response_model=VolunteerOut)
async def toggle_volunteer_status(
    volunteer_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Toggle a volunteer's active status."""
    result = await db.execute(
        select(User).where(User.id == volunteer_id, User.role == UserRole.VOLUNTEER)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer not found")

    user.is_active = not user.is_active
    await db.flush()
    await db.refresh(user)

    count_result = await db.execute(
        select(func.count()).select_from(Attendance).where(Attendance.marked_by == user.id)
    )
    count = count_result.scalar() or 0

    return VolunteerOut(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        is_active=user.is_active,
        created_at=user.created_at,
        attendance_count=count,
    )


@router.delete("/volunteers/{volunteer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_volunteer(
    volunteer_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    """Remove a volunteer account."""
    if volunteer_id == admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own admin account",
        )

    result = await db.execute(
        select(User).where(User.id == volunteer_id, User.role == UserRole.VOLUNTEER)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Volunteer not found")

    await db.delete(user)
    await db.flush()


@router.get("/export/participants")
async def export_participants(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Export all participants as CSV."""
    result = await db.execute(select(Participant).order_by(Participant.id))
    participants = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Name", "Email", "Phone", "Institution", "Category", "Registered At"])
    for p in participants:
        writer.writerow([
            p.id,
            p.name,
            p.email,
            p.phone or "",
            p.institution or "",
            p.category.value,
            p.registered_at.isoformat() if p.registered_at else "",
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=participants.csv"},
    )


@router.get("/export/attendance")
async def export_attendance(
    format: str = "csv",
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    """Export all attendance records as CSV or Excel."""
    result = await db.execute(
        select(
            Attendance.id,
            Participant.name,
            Participant.email,
            Session.name.label("session_name"),
            Attendance.method,
            Attendance.marked_at,
        )
        .join(Participant, Attendance.participant_id == Participant.id)
        .outerjoin(Session, Attendance.session_id == Session.id)
        .order_by(Attendance.marked_at.desc())
    )
    rows = result.all()

    headers = ["ID", "Participant Name", "Email", "Session", "Method", "Marked At"]

    if format == "excel":
        wb = Workbook()
        ws = wb.active
        ws.title = "Attendance"
        ws.append(headers)
        for row in rows:
            ws.append([
                row[0],
                row[1],
                row[2],
                row[3] or "Event Check-in",
                row[4].value if row[4] else "",
                row[5].isoformat() if row[5] else "",
            ])
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=attendance.xlsx"},
        )

    # Default CSV
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    for row in rows:
        writer.writerow([
            row[0],
            row[1],
            row[2],
            row[3] or "Event Check-in",
            row[4].value if row[4] else "",
            row[5].isoformat() if row[5] else "",
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=attendance.csv"},
    )
