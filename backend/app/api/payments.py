"""Payments API — Cashfree payment gateway integration."""

from __future__ import annotations

import logging
import uuid

import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.deps import get_db
from app.schemas.schemas import (
    CreateOrderRequest,
    CreateOrderResponse,
    VerifyPaymentRequest,
    VerifyPaymentResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/payments", tags=["payments"])

CASHFREE_SANDBOX_URL = "https://sandbox.cashfree.com/pg"
CASHFREE_PROD_URL = "https://api.cashfree.com/pg"


def get_cashfree_base_url() -> str:
    if settings.CASHFREE_ENV == "production":
        return CASHFREE_PROD_URL
    return CASHFREE_SANDBOX_URL


@router.post("/create-order", response_model=CreateOrderResponse)
async def create_order(body: CreateOrderRequest, db: AsyncSession = Depends(get_db)):
    if not settings.cashfree_configured:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    order_id = f"GEEKAI_{body.event_slug.upper()}_{uuid.uuid4().hex[:8].upper()}"

    payload = {
        "order_id": order_id,
        "order_amount": body.amount / 100,  # Cashfree expects amount in rupees
        "order_currency": "INR",
        "customer_details": {
            "customer_id": f"CUST_{body.customer_email.replace('@', '_').replace('.', '_')}",
            "customer_email": body.customer_email,
            "customer_phone": body.customer_phone or "9999999999",
            "customer_name": body.customer_name,
        },
        "order_meta": {
            "notify_url": f"{settings.BACKEND_URL}/api/payments/webhook",
        },
    }

    headers = {
        "Content-Type": "application/json",
        "x-api-version": "2023-08-01",
        "x-client-id": settings.CASHFREE_APP_ID,
        "x-client-secret": settings.CASHFREE_SECRET_KEY,
    }

    base_url = get_cashfree_base_url()

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{base_url}/orders", json=payload, headers=headers)

    if response.status_code not in (200, 201):
        logger.error(f"Cashfree order creation failed: {response.text}")
        raise HTTPException(status_code=502, detail="Payment gateway error")

    data = response.json()
    return CreateOrderResponse(
        order_id=order_id,
        payment_session_id=data.get("payment_session_id", ""),
        order_status=data.get("order_status", "ACTIVE"),
    )


@router.post("/verify", response_model=VerifyPaymentResponse)
async def verify_payment(body: VerifyPaymentRequest):
    """Verify Cashfree payment using order ID."""
    if not settings.cashfree_configured:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    headers = {
        "x-api-version": "2023-08-01",
        "x-client-id": settings.CASHFREE_APP_ID,
        "x-client-secret": settings.CASHFREE_SECRET_KEY,
    }

    base_url = get_cashfree_base_url()

    async with httpx.AsyncClient() as client:
        response = await client.get(f"{base_url}/orders/{body.order_id}", headers=headers)

    if response.status_code != 200:
        raise HTTPException(status_code=502, detail="Could not verify payment")

    data = response.json()
    order_status = data.get("order_status", "")
    paid = order_status == "PAID"

    return VerifyPaymentResponse(
        order_id=body.order_id,
        order_status=order_status,
        paid=paid,
        amount=int((data.get("order_amount", 0)) * 100),  # convert back to paise
    )


@router.post("/webhook")
async def cashfree_webhook(request: dict):
    """Cashfree webhook for payment notifications."""
    logger.info(f"Cashfree webhook received: {request}")
    return {"status": "ok"}
