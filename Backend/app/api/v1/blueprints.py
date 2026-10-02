from __future__ import annotations

import hashlib
import json

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db

router = APIRouter(tags=["blueprints"])


def _out(row):  # type: ignore[no-untyped-def]
    return {
        "blueprint_code": row.blueprint_code,
        "tier_name": row.tier_name,
        "network_architecture": row.network_architecture,
        "hardware_bom": list(row.hardware_bom or []),
        "recommended_software_integrations": list(row.recommended_software_integrations or []),
        "base_estimated_cost": int(row.base_estimated_cost),
    }


def _etag(s: str) -> str:
    return 'W/"' + hashlib.sha256(s.encode()).hexdigest()[:16] + '"'


@router.get("/hardware-blueprints")
async def list_bp(request: Request, response: Response, db: AsyncSession = Depends(get_db)):  # type: ignore[no-untyped-def]
    from app.models.tables import HardwareBlueprint

    rows = (
        (await db.execute(select(HardwareBlueprint).order_by(HardwareBlueprint.blueprint_code.asc()))).scalars().all()
    )
    body = {"success": True, "blueprints": [_out(r) for r in rows]}
    tag = _etag(json.dumps(body, sort_keys=True, default=str))
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    response.headers["ETag"] = tag
    if request.headers.get("if-none-match") == tag:
        from fastapi.responses import Response as _R

        return _R(status_code=304)
    return body


@router.get("/hardware-blueprints/{code}")
async def get_bp(code: str, request: Request, response: Response, db: AsyncSession = Depends(get_db)):  # type: ignore[no-untyped-def]
    from app.models.tables import HardwareBlueprint

    row = (
        await db.execute(select(HardwareBlueprint).where(HardwareBlueprint.blueprint_code == code))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="not_found")
    body = {"success": True, "blueprint": _out(row)}
    tag = _etag(json.dumps(body, sort_keys=True, default=str))
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    response.headers["ETag"] = tag
    if request.headers.get("if-none-match") == tag:
        from fastapi.responses import Response as _R

        return _R(status_code=304)
    return body
