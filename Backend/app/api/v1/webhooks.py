from __future__ import annotations

import hashlib
import math
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Request
from sqlalchemy import func, select

from app.config import get_settings
from app.core.security import error_response, verify_hmac

router = APIRouter(tags=["webhooks"])

_MAX_WEBHOOK_AGE_SECONDS = 86400
_MAX_WEBHOOK_FUTURE_SECONDS = 300


def _parse_webhook_timestamp(raw_ts: Any) -> datetime | None:
    if raw_ts is None or isinstance(raw_ts, bool):
        return None
    if isinstance(raw_ts, (int, float)):
        val = float(raw_ts)
        if not math.isfinite(val):
            return None
        if val > 1e12:
            val /= 1000.0
        try:
            return datetime.fromtimestamp(val, tz=UTC)
        except (OverflowError, OSError, ValueError):
            return None
    text = str(raw_ts).strip()
    if not text:
        return None
    num: float | None
    try:
        num = float(text)
    except ValueError:
        num = None
    if num is not None:
        if not math.isfinite(num):
            return None
        if num > 1e12:
            num /= 1000.0
        try:
            return datetime.fromtimestamp(num, tz=UTC)
        except (OverflowError, OSError, ValueError):
            return None
    try:
        dt = datetime.fromisoformat(text.replace("Z", "+00:00"))
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=UTC)
        return dt.astimezone(UTC)
    except ValueError:
        return None


@router.post("/webhooks/cal")
async def cal_webhook(request: Request) -> Any:
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
        parsed = await request.json()
        payload: dict[str, Any] = parsed if isinstance(parsed, dict) else {}
    except Exception:
        payload = {}

    # Read timestamp strictly from the HMAC-signed JSON payload (never unsigned HTTP headers)
    ts_raw = payload["createdAt"] if payload.get("createdAt") is not None else payload.get("timestamp")
    if ts_raw is not None and (isinstance(ts_raw, (int, float)) or str(ts_raw).strip()):
        ts = _parse_webhook_timestamp(ts_raw)
        if ts is None:
            return error_response(401, "unauthorized", "Invalid webhook timestamp")
        age = (datetime.now(UTC) - ts).total_seconds()
        if age > _MAX_WEBHOOK_AGE_SECONDS or age < -_MAX_WEBHOOK_FUTURE_SECONDS:
            return error_response(401, "unauthorized", "Stale webhook timestamp")

    sig_norm = sig.strip().removeprefix("sha256=")
    digest = hashlib.sha256(sig_norm.encode("utf-8") + b":" + raw).hexdigest()
    from app.core.redis import get_redis_client

    redis = get_redis_client()
    if redis is None:
        log.error("webhook_replay_redis_unavailable")
        return error_response(503, "service_unavailable", "Webhook replay store unavailable")
    try:
        acquired = await redis.set(f"cal_webhook_seen:{digest}", "1", nx=True, ex=86400)
        if not acquired:
            log.info("webhook_replay_blocked", digest=digest[:12])
            return {"success": True, "duplicate": True}
    except Exception as exc:
        log.warning("webhook_replay_redis_error", error=str(type(exc).__name__))
        return error_response(503, "service_unavailable", "Webhook replay store unavailable")

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
                if row.status == "new":
                    row.status = "discovery_booked"
                    row.booked_at = datetime.now(UTC)
                    await s.commit()
    return {"success": True}
