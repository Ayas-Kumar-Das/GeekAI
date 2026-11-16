"""Database migration and initialization service."""

from __future__ import annotations

import asyncio
import logging
import time
from pathlib import Path

from alembic import command
from alembic.config import Config

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_alembic_config() -> Config:
    """Resolve and configure Alembic config pointing to backend directory."""
    # Look for alembic.ini relative to this file's hierarchy or working directory
    current_dir = Path(__file__).resolve().parent  # app/core
    backend_dir = current_dir.parent.parent        # backend

    ini_candidates = [
        backend_dir / "alembic.ini",
        Path.cwd() / "alembic.ini",
        Path.cwd() / "backend" / "alembic.ini",
    ]

    ini_path = None
    for candidate in ini_candidates:
        if candidate.is_file():
            ini_path = candidate
            break

    if not ini_path:
        raise FileNotFoundError("Could not find alembic.ini in project directories")

    alembic_cfg = Config(str(ini_path))
    # Ensure migrations directory is resolved relative to alembic.ini
    migrations_dir = ini_path.parent / "migrations"
    alembic_cfg.set_main_option("script_location", str(migrations_dir))
    alembic_cfg.set_main_option("sqlalchemy.url", settings.DATABASE_URL)
    return alembic_cfg


def run_migrations(max_retries: int = 5, retry_interval: float = 2.0) -> None:
    """Run Alembic migrations to the latest revision (head).

    Includes retry logic to handle cases where PostgreSQL is still initializing.
    """
    alembic_cfg = get_alembic_config()
    logger.info("Applying database migrations (alembic upgrade head)...")

    for attempt in range(1, max_retries + 1):
        try:
            command.upgrade(alembic_cfg, "head")
            logger.info("Database migrations applied successfully.")
            return
        except Exception as exc:
            if attempt < max_retries:
                logger.warning(
                    "Database migration attempt %d/%d failed: %s. Retrying in %.1fs...",
                    attempt,
                    max_retries,
                    exc,
                    retry_interval,
                )
                time.sleep(retry_interval)
            else:
                logger.error("Failed to apply database migrations after %d attempts: %s", max_retries, exc)
                raise exc


async def run_migrations_async() -> None:
    """Asynchronously execute migrations in a worker thread so the event loop is unblocked."""
    await asyncio.to_thread(run_migrations)


async def seed_initial_users_async() -> None:
    """Auto-seed initial admin and volunteer if the database has zero users."""
    try:
        from app.core.deps import async_session_factory
        from app.core.security import hash_password
        from app.models.models import User, UserRole
        from sqlalchemy import func, select

        async with async_session_factory() as session:
            count = (await session.execute(select(func.count()).select_from(User))).scalar()
            if count == 0:
                logger.info("Database has zero users — seeding default admin and volunteer...")
                admin_user = User(
                    email="admin@geekai.in",
                    password_hash=hash_password("admin123"),
                    name="System Admin",
                    role=UserRole.ADMIN,
                )
                volunteer_user = User(
                    email="volunteer@geekai.in",
                    password_hash=hash_password("volunteer123"),
                    name="Symposium Volunteer",
                    role=UserRole.VOLUNTEER,
                )
                session.add_all([admin_user, volunteer_user])
                await session.commit()
                logger.info("Auto-seeded admin@geekai.in and volunteer@geekai.in successfully.")
    except Exception as exc:
        logger.warning("Could not auto-seed initial users: %s", exc)


