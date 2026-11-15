"""Embeddings API — sync face embeddings for face-checkin client."""

from __future__ import annotations

from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import get_db
from app.models.models import FaceEmbedding, Participant
from app.schemas.schemas import EmbeddingOut

router = APIRouter(prefix="/api/embeddings", tags=["embeddings"])


@router.get("/sync", response_model=list[EmbeddingOut])
async def sync_embeddings(
    since: Optional[str] = Query(None, description="ISO datetime — return only embeddings created after this time"),
    db: AsyncSession = Depends(get_db),
):
    """Return all face embeddings (or those created since a given timestamp).

    Used by the face-checkin desktop client to download / incrementally sync
    the embedding database.
    """
    query = (
        select(FaceEmbedding)
        .options(selectinload(FaceEmbedding.participant))
        .order_by(FaceEmbedding.created_at)
    )

    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            query = query.where(FaceEmbedding.created_at > since_dt)
        except ValueError:
            pass  # ignore malformed timestamp — return all

    result = await db.execute(query)
    embeddings = result.scalars().all()

    out: list[EmbeddingOut] = []
    for emb in embeddings:
        participant = emb.participant
        out.append(
            EmbeddingOut(
                participant_id=emb.participant_id,
                name=participant.name if participant else "Unknown",
                embedding=emb.embedding if emb.embedding else [0.0] * 512,
                photo_url=participant.photo_url if participant else None,
            )
        )
    return out
