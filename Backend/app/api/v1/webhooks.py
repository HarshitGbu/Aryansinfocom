from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Request
from sqlalchemy import func, select

from app.config import get_settings
from app.core.security import error_response, verify_hmac

router = APIRouter(tags=["webhooks"])


@router.post("/webhooks/cal")
async def cal_webhook(request: Request):  # type: ignore[no-untyped-def]
    import structlog

    log = structlog.get_logger("webhooks")
    secret = get_settings().CAL_WEBHOOK_SECRET
    if not secret:
        return error_response(404, "not_found", "Not found")
    raw = await request.body()
    sig = request.headers.get("x-cal-signature", "") or request.headers.get("x-signature", "") or ""
    if not verify_hmac(secret, raw, sig):
        return error_response(401, "unauthorized", "unauthorized")
    try:
        payload = await request.json()
    except Exception:
        payload = {}
    # find email
    email = ""
    for key in ("attendee_email", "email"):
        if key in payload:
            email = str(payload[key])
    # nested cal shapes
    try:
        email = email or str(payload.get("payload", {}).get("attendees", [{}])[0].get("email", ""))
    except Exception:
        pass
    try:
        email = email or str(payload.get("data", {}).get("email", ""))
    except Exception:
        pass
    event = str(payload.get("type", "") or payload.get("event", "")).lower()
    is_booking = ("booking" in event) or ("created" in event)
    if email and is_booking:
        from app.core.db import get_session_factory
        from app.models.tables import LeadEstimate

        factory = get_session_factory()
        async with factory() as s:
            row = (
                await s.execute(
                    select(LeadEstimate)
                    .where(func.lower(LeadEstimate.client_email) == email.lower())
                    .order_by(LeadEstimate.created_at.desc())
                    .limit(1)
                )
            ).scalar_one_or_none()
            if row is None:
                log.info("webhook_unknown_email", email_hash="redacted")
            else:
                if row.status != "discovery_booked":
                    row.status = "discovery_booked"
                    row.booked_at = datetime.now(UTC)
                    await s.commit()
    return {"success": True}
