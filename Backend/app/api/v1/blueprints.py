from __future__ import annotations

from typing import TYPE_CHECKING, Any

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.v1.common import etagged_json
from app.core.db import get_db

if TYPE_CHECKING:
    from app.models.tables import HardwareBlueprint

router = APIRouter(tags=["blueprints"])


def _out(row: HardwareBlueprint) -> dict[str, Any]:
    return {
        "blueprint_code": row.blueprint_code,
        "tier_name": row.tier_name,
        "network_architecture": row.network_architecture,
        "hardware_bom": list(row.hardware_bom or []),
        "recommended_software_integrations": list(row.recommended_software_integrations or []),
        "base_estimated_cost": int(row.base_estimated_cost),
    }


@router.get("/hardware-blueprints")
async def list_bp(request: Request, response: Response, db: AsyncSession = Depends(get_db)) -> Any:
    from app.models.tables import HardwareBlueprint

    rows = (
        (await db.execute(select(HardwareBlueprint).order_by(HardwareBlueprint.blueprint_code.asc()))).scalars().all()
    )
    body = {"success": True, "blueprints": [_out(r) for r in rows]}
    return etagged_json(request, response, body, default=str)


@router.get("/hardware-blueprints/{code}")
async def get_bp(code: str, request: Request, response: Response, db: AsyncSession = Depends(get_db)) -> Any:
    from app.models.tables import HardwareBlueprint

    row = (
        await db.execute(select(HardwareBlueprint).where(HardwareBlueprint.blueprint_code == code))
    ).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="not_found")
    body = {"success": True, "blueprint": _out(row)}
    return etagged_json(request, response, body, default=str)
