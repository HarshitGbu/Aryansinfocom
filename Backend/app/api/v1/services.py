from __future__ import annotations

import hashlib

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db

router = APIRouter(tags=["services"])


def _summary(row):  # type: ignore[no-untyped-def]
    return {
        "id": str(row.id),
        "slug": row.slug,
        "title": row.title,
        "category": row.category,
        "short_description": row.short_description,
        "technologies_used": list(row.technologies_used or []),
        "is_featured": bool(row.is_featured),
    }


def _etag(payload: str) -> str:
    return 'W/"' + hashlib.sha256(payload.encode()).hexdigest()[:16] + '"'


@router.get("/services")
async def list_services(
    request: Request, response: Response, category: str | None = None, db: AsyncSession = Depends(get_db)
):  # type: ignore[no-untyped-def]
    from app.models.tables import Service

    if category is not None and category not in ("web", "erp", "ai", "infrastructure"):
        raise HTTPException(status_code=422, detail="validation_error")
    q = select(Service).order_by(Service.sort_order.asc(), Service.created_at.desc())
    if category:
        q = q.where(Service.category == category)
    rows = (await db.execute(q)).scalars().all()
    body = {"success": True, "services": [_summary(r) for r in rows]}
    import json as _j

    tag = _etag(_j.dumps(body, sort_keys=True))
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    response.headers["ETag"] = tag
    if request.headers.get("if-none-match") == tag:
        from fastapi.responses import Response as _R

        return _R(status_code=304)
    return body


@router.get("/services/{slug}")
async def get_service(slug: str, request: Request, response: Response, db: AsyncSession = Depends(get_db)):  # type: ignore[no-untyped-def]
    from app.models.tables import Service

    row = (await db.execute(select(Service).where(Service.slug == slug))).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="not_found")
    item = _summary(row)
    item.update(
        {
            "full_content": row.full_content,
            "created_at": row.created_at.isoformat(),
            "updated_at": row.updated_at.isoformat(),
        }
    )
    body = {"success": True, "service": item}
    import json as _j

    tag = _etag(_j.dumps(body, sort_keys=True))
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    response.headers["ETag"] = tag
    if request.headers.get("if-none-match") == tag:
        from fastapi.responses import Response as _R

        return _R(status_code=304)
    return body
