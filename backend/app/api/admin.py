"""Admin API — dashboard stats and data exports."""

from __future__ import annotations

import csv
import io
from datetime import datetime

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_admin, get_db
from app.models.models import Attendance, Participant, ParticipantCategory, Session, User
from app.schemas.schemas import DashboardStats, ParticipantOut

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
