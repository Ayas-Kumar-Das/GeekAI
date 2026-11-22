"""Application settings loaded from environment variables."""

from __future__ import annotations

from pathlib import Path
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/geekai"

    # JWT
    SECRET_KEY: str = "change-me-to-a-random-secret-at-least-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"

    @property
    def cors_origin_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    # SMTP
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = "noreply@geekai.in"
    SMTP_USE_TLS: bool = True

    @property
    def smtp_configured(self) -> bool:
        return bool(self.SMTP_HOST and self.SMTP_USER and self.SMTP_PASSWORD)

    # Uploads
    UPLOAD_DIR: str = "uploads"

    @property
    def photos_dir(self) -> Path:
        p = Path(self.UPLOAD_DIR) / "photos"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def qrcodes_dir(self) -> Path:
        p = Path(self.UPLOAD_DIR) / "qrcodes"
        p.mkdir(parents=True, exist_ok=True)
        return p

    # Seed admin
    SEED_ADMIN_EMAIL: str = "admin@geekai.in"
    SEED_ADMIN_PASSWORD: str = "admin123"
    SEED_ADMIN_NAME: str = "System Admin"

    # Cashfree Payment Gateway
    CASHFREE_APP_ID: str = ""
    CASHFREE_SECRET_KEY: str = ""
    CASHFREE_ENV: str = "sandbox"  # "sandbox" or "production"

    @property
    def cashfree_configured(self) -> bool:
        return bool(self.CASHFREE_APP_ID and self.CASHFREE_SECRET_KEY)

    # Backend base URL (for webhooks etc.)
    BACKEND_URL: str = "http://localhost:8000"


settings = Settings()
