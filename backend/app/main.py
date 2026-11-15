"""GeekAI — FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    # Ensure upload directories exist
    settings.photos_dir
    settings.qrcodes_dir
    logger.info("GeekAI backend starting — upload directories ready")
    yield
    logger.info("GeekAI backend shutting down")


app = FastAPI(
    title="GeekAI",
    description="Registration & Attendance Management for the Odisha AI Symposium",
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Static files — serve uploaded photos & QR codes
# ---------------------------------------------------------------------------
uploads_path = Path(settings.UPLOAD_DIR)
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# ---------------------------------------------------------------------------
# Routers
# ---------------------------------------------------------------------------
from app.api.admin import router as admin_router  # noqa: E402
from app.api.attendance import router as attendance_router  # noqa: E402
from app.api.auth import router as auth_router  # noqa: E402
from app.api.embeddings import router as embeddings_router  # noqa: E402
from app.api.participants import router as participants_router  # noqa: E402
from app.api.sessions import router as sessions_router  # noqa: E402

app.include_router(auth_router)
app.include_router(participants_router)
app.include_router(sessions_router)
app.include_router(attendance_router)
app.include_router(embeddings_router)
app.include_router(admin_router)


@app.get("/", tags=["health"])
async def root():
    return {"status": "ok", "app": "GeekAI", "version": "1.0.0"}


@app.get("/health", tags=["health"])
@app.get("/api/health", tags=["health"])
async def health():
    return {"status": "healthy"}
