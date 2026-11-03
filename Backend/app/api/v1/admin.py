from __future__ import annotations

import uuid
from typing import get_args

from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import error_response, require_admin
from app.schemas.requests import AdminPatchRequest, LeadStatus

router = APIRouter(tags=["admin"])
VALID_STATUS = get_args(LeadStatus)


@router.get("/admin/leads")
async def list_leads(
    request: Request, status: str | None = None, limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)
):  # type: ignore[no-untyped-def]
    try:
        require_admin(request)
    except Exception:
        return error_response(401, "unauthorized", "unauthorized")
    if status is not None and status not in VALID_STATUS:
        return error_response(422, "validation_error", "Invalid status")
    from app.models.tables import LeadEstimate

    q = select(LeadEstimate).order_by(LeadEstimate.created_at.desc())
    if status:
        q = q.where(LeadEstimate.status == status)
    rows = (await db.execute(q.offset(offset).limit(min(limit, 100)))).scalars().all()
    items = [
        {
            "id": str(r.id),
            "client_name": r.client_name,
            "client_email": r.client_email,
            "company_name": r.company_name,
            "status": r.status,
            "lead_score": r.lead_score,
            "estimate": r.estimate_result,
            "created_at": r.created_at.isoformat(),
        }
        for r in rows
    ]
    return {"success": True, "leads": items}


@router.patch("/admin/leads/{lead_id}")
async def patch_lead(lead_id: str, request: Request, db: AsyncSession = Depends(get_db)):  # type: ignore[no-untyped-def]
    try:
        require_admin(request)
    except Exception:
        return error_response(401, "unauthorized", "unauthorized")
    try:
        patch = AdminPatchRequest.model_validate(await request.json())
    except Exception:
        return error_response(422, "validation_error", "Invalid status")
    try:
        lead_uuid = uuid.UUID(lead_id)
    except ValueError:
        return error_response(422, "validation_error", "Invalid lead id")
    from app.models.tables import LeadEstimate

    row = await db.get(LeadEstimate, lead_uuid)
    if row is None:
        return error_response(404, "not_found", "Not found")
    row.status = patch.status
    await db.commit()
    return {"success": True, "lead": {"id": str(row.id), "status": row.status}}
