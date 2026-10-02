from __future__ import annotations

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import require_admin

router = APIRouter(tags=["admin"])
VALID_STATUS = ("new", "contacted", "discovery_booked", "closed")


@router.get("/admin/leads")
async def list_leads(
    request: Request, status: str | None = None, limit: int = 20, offset: int = 0, db: AsyncSession = Depends(get_db)
):  # type: ignore[no-untyped-def]
    try:
        require_admin(request)
    except Exception:
        return JSONResponse(
            status_code=401, content={"success": False, "error": {"code": "unauthorized", "message": "unauthorized"}}
        )
    if status is not None and status not in VALID_STATUS:
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": {"code": "validation_error", "message": "Invalid status"}},
        )
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
        return JSONResponse(
            status_code=401, content={"success": False, "error": {"code": "unauthorized", "message": "unauthorized"}}
        )
    try:
        body = await request.json()
    except Exception:
        body = {}
    st = body.get("status")
    if st not in VALID_STATUS:
        return JSONResponse(
            status_code=422,
            content={"success": False, "error": {"code": "validation_error", "message": "Invalid status"}},
        )
    from app.models.tables import LeadEstimate

    row = await db.get(LeadEstimate, lead_id)  # type: ignore[arg-type]
    if row is None:
        return JSONResponse(
            status_code=404, content={"success": False, "error": {"code": "not_found", "message": "Not found"}}
        )
    row.status = st  # type: ignore[assignment]
    await db.commit()
    return {"success": True, "lead": {"id": str(row.id), "status": row.status}}
