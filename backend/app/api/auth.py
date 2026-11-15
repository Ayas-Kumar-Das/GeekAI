"""Auth API — login, register, seed."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_current_admin, get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.models import User, UserRole
from app.schemas.schemas import (
    LoginRequest,
    RegisterRequest,
    SeedRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    token = create_access_token({"sub": str(user.id), "role": user.role.value})
    return TokenResponse(access_token=token, role=user.role, name=user.name)


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(get_current_admin),
):
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=body.role,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


@router.post("/seed", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def seed(body: SeedRequest, db: AsyncSession = Depends(get_db)):
    """Create initial admin user. Only works when no users exist."""
    count_result = await db.execute(select(func.count()).select_from(User))
    if count_result.scalar() > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Users already exist — seed is not allowed",
        )

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        name=body.name,
        role=UserRole.ADMIN,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user
