"""Sessions API — CRUD for symposium sessions."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_admin, get_current_user, get_db
from app.models.models import Attendance, Session, User
from app.schemas.schemas import SessionCreate, SessionDetail, SessionOut, SessionUpdate

router = APIRouter(prefix="/api/sessions", tags=["sessions"])


@router.post("/", response_model=SessionOut, status_code=status.HTTP_201_CREATED)
async def create_session(
    body: SessionCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    session = Session(**body.model_dump())
    db.add(session)
    await db.flush()
    await db.refresh(session)
    return session


@router.get("/", response_model=list[SessionOut])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).order_by(Session.start_time))
    return result.scalars().all()


@router.get("/{session_id}", response_model=SessionDetail)
async def get_session(session_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    count_result = await db.execute(
        select(func.count()).select_from(Attendance).where(Attendance.session_id == session_id)
    )
    count = count_result.scalar()

    return SessionDetail(
        id=session.id,
        name=session.name,
        description=session.description,
        start_time=session.start_time,
        end_time=session.end_time,
        location=session.location,
        created_at=session.created_at,
        attendance_count=count,
    )


@router.put("/{session_id}", response_model=SessionOut)
async def update_session(
    session_id: int,
    body: SessionUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(session, key, value)

    await db.flush()
    await db.refresh(session)
    return session


@router.delete("/{session_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_session(
    session_id: int,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    result = await db.execute(select(Session).where(Session.id == session_id))
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    await db.delete(session)
    await db.flush()
