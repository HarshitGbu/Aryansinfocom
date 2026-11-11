from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.db import get_db
from app.core.security import client_ip, error_response, hash_ip
from app.schemas.common import EstimateRequest
from app.schemas.requests import ContactRequest, LeadSubmitRequest

router = APIRouter(tags=["estimate"])


def _pricing() -> dict[str, Any]:
    from app.services.pricing.engine import load_pricing

    return load_pricing(get_settings().PRICING_FILE)


@router.post("/estimate/calculate")
async def calculate(payload: EstimateRequest, request: Request):  # type: ignore[no-untyped-def]
    from app.services.pricing.engine import calculate, validate_estimate_input

    data = payload.model_dump()
    errs = validate_estimate_input(data)
    if errs:
        return error_response(422, "validation_error", "Validation failed", {"fields": errs})
    result = calculate(_pricing(), data)
    resp = JSONResponse(content={"success": True, "estimate": result})
    resp.headers["Cache-Control"] = "no-store"
    return resp


@router.post("/estimate/submit")
async def submit(payload: LeadSubmitRequest, request: Request, db: AsyncSession = Depends(get_db)):  # type: ignore[no-untyped-def]
    import structlog

    log = structlog.get_logger("leads")
    # honeypot
    if payload.website:
        log.info("honeypot_hit", path="/estimate/submit")
        from app.services.pricing.engine import calculate as _calc

        est = _calc(_pricing(), payload.estimate_input.model_dump())
        return {
            "success": True,
            "lead_id": "00000000-0000-0000-0000-000000000000",
            "status": "new",
            "estimate": est,
            "booking_url": get_settings().PUBLIC_BOOKING_URL or None,
        }
    if payload.consent is not True:
        return error_response(422, "validation_error", "Consent required", {"fields": {"consent": ["must be true"]}})
    from app.services.pricing.engine import calculate, validate_estimate_input

    data = payload.estimate_input.model_dump()
    errs = validate_estimate_input(data)
    if errs:
        return error_response(422, "validation_error", "Validation failed", {"fields": errs})
    result = calculate(_pricing(), data)
    # dedupe
    from app.models.base import canonical_json
    from app.models.tables import LeadEstimate

    chash = hashlib.sha256(canonical_json(data).encode()).hexdigest()
    email_l = payload.client_email.lower()
    # find recent same email+input within 10 min
    rows = (
        (
            await db.execute(
                select(LeadEstimate)
                .where(func.lower(LeadEstimate.client_email) == email_l)
                .order_by(LeadEstimate.created_at.desc())
                .limit(20)
            )
        )
        .scalars()
        .all()
    )
    now = datetime.now(UTC)
    for r in rows:
        if r.estimate_input and hashlib.sha256(canonical_json(r.estimate_input).encode()).hexdigest() == chash:
            created = r.created_at
            if created.tzinfo is None:
                created = created.replace(tzinfo=UTC)
            if (now - created).total_seconds() <= 600:
                return {
                    "success": True,
                    "lead_id": str(r.id),
                    "status": r.status,
                    "estimate": r.estimate_result,
                    "booking_url": get_settings().PUBLIC_BOOKING_URL or None,
                }
    from app.services.lead_scoring import score_lead

    office = data.get("office_parameters") or {}
    ws = int(office.get("workstations", 0))
    sqft = int(office.get("floor_area_sqft", 0))
    score = score_lead(
        result, payload.company_name, payload.phone_number, payload.notes, list(data.get("selected_services", [])), ws
    )
    lead = LeadEstimate(
        client_name=payload.client_name,
        client_email=str(payload.client_email),
        company_name=payload.company_name,
        phone_number=payload.phone_number,
        selected_services=list(data.get("selected_services", [])),
        office_size_sqft=sqft,
        workstation_count=ws,
        ai_deployment_type=result["ai_deployment_type"],
        estimated_budget_min=result["cost_range_usd"]["min"],
        estimated_budget_max=result["cost_range_usd"]["max"],
        estimated_timeline_weeks=result["timeline_weeks"]["max"],
        estimated_timeline_weeks_min=result["timeline_weeks"]["min"],
        estimate_input=data,
        estimate_result=result,
        pricing_version=result["pricing_version"],
        notes=payload.notes,
        consent_at=now,
        ip_hash=hash_ip(client_ip(request)),
        lead_score=score,
        status="new",
    )
    db.add(lead)
    await db.commit()
    await db.refresh(lead)
    # enqueue (best effort)
    try:
        from app.core.redis import get_redis_client

        r = get_redis_client()
        if r is not None:
            from arq import create_pool
            from arq.connections import RedisSettings

            pool = await create_pool(RedisSettings.from_dsn(get_settings().REDIS_URL))
            try:
                await pool.enqueue_job("notify_new_lead_task", str(lead.id))
                await pool.enqueue_job("send_lead_confirmation_task", str(lead.id))
            finally:
                await pool.aclose()
    except Exception as e:
        log.error("enqueue_failed", lead_id=str(lead.id), error=str(e)[:200])
    return {
        "success": True,
        "lead_id": str(lead.id),
        "status": lead.status,
        "estimate": result,
        "booking_url": get_settings().PUBLIC_BOOKING_URL or None,
    }


@router.post("/contact")
async def contact(payload: ContactRequest, request: Request, db: AsyncSession = Depends(get_db)):  # type: ignore[no-untyped-def]
    import structlog

    log = structlog.get_logger("leads")
    if payload.website:
        log.info("honeypot_hit", path="/contact")
        return {"success": True, "submission_id": "00000000-0000-0000-0000-000000000000"}
    if payload.consent is not True:
        return error_response(422, "validation_error", "Consent required")
    if payload.topic and payload.topic not in ("software", "erp", "ai", "infrastructure", "other"):
        return error_response(422, "validation_error", "Invalid topic")
    from datetime import datetime

    from app.models.tables import ContactSubmission

    now = datetime.now(UTC)
    row = ContactSubmission(
        name=payload.name,
        email=str(payload.email),
        company=payload.company,
        topic=payload.topic,
        message=payload.message,
        consent_at=now,
        ip_hash=hash_ip(client_ip(request)),
        status="new",
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    try:
        from app.core.redis import get_redis_client

        r = get_redis_client()
        if r is not None:
            from arq import create_pool
            from arq.connections import RedisSettings

            pool = await create_pool(RedisSettings.from_dsn(get_settings().REDIS_URL))
            try:
                await pool.enqueue_job("notify_new_contact_task", str(row.id))
            finally:
                await pool.aclose()
    except Exception as e:
        log.error("enqueue_failed", error=str(e)[:200])
    return {"success": True, "submission_id": str(row.id)}
