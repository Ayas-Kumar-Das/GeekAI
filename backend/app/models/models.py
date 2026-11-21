"""SQLAlchemy ORM models for GeekAI."""

from __future__ import annotations

import enum
from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    VOLUNTEER = "VOLUNTEER"


class ParticipantCategory(str, enum.Enum):
    STUDENT = "STUDENT"
    RESEARCHER = "RESEARCHER"
    PROFESSIONAL = "PROFESSIONAL"
    SPEAKER = "SPEAKER"
    OTHER = "OTHER"


class AttendanceMethod(str, enum.Enum):
    FACE = "FACE"
    QR = "QR"
    MANUAL = "MANUAL"


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String(320), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    name = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.VOLUNTEER)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    password_changed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    attendances_marked = relationship("Attendance", back_populates="marked_by_user")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(320), unique=True, nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    institution = Column(String(255), nullable=True)
    category = Column(
        Enum(ParticipantCategory, name="participant_category"),
        nullable=False,
        default=ParticipantCategory.OTHER,
    )
    photo_url = Column(String(512), nullable=True)
    qr_code_url = Column(String(512), nullable=True)
    registered_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    face_embeddings = relationship("FaceEmbedding", back_populates="participant", cascade="all, delete-orphan")
    attendances = relationship("Attendance", back_populates="participant", cascade="all, delete-orphan")


class FaceEmbedding(Base):
    __tablename__ = "face_embeddings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    participant_id = Column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    embedding = Column(Vector(512), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    participant = relationship("Participant", back_populates="face_embeddings")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    attendances = relationship("Attendance", back_populates="session", cascade="all, delete-orphan")


class Attendance(Base):
    __tablename__ = "attendance"
    __table_args__ = (
        UniqueConstraint("participant_id", "session_id", name="uq_participant_session"),
        Index(
            "unique_event_attendance",
            "participant_id",
            unique=True,
            postgresql_where="session_id IS NULL",
        ),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    participant_id = Column(Integer, ForeignKey("participants.id", ondelete="CASCADE"), nullable=False, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=True, index=True)
    method = Column(Enum(AttendanceMethod, name="attendance_method"), nullable=False)
    marked_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    marked_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)

    # Relationships
    participant = relationship("Participant", back_populates="attendances")
    session = relationship("Session", back_populates="attendances")
    marked_by_user = relationship("User", back_populates="attendances_marked")
