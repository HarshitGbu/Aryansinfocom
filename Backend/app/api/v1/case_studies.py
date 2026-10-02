from __future__ import annotations

import hashlib
import json

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db

router = APIRouter(tags=["case-studies"])

VALID_FILTERS = ("all", "web", "erp", "ai", "hardware", "hybrid")


def humanize(key: str) -> str:
    label = key.replace("_", " ").strip()
    return label[:1].upper() + label[1:] if label else key


def to_metrics(obj: dict) -> list[dict]:
    out = []
    for k, v in (obj or {}).items():
        out.append({"key": k, "label": humanize(k), "value": str(v)})
    return out


def _summary(row):  # type: ignore[no-untyped-def]
    m = to_metrics(row.metrics or {})
    stack = list(row.software_stack or [])
    return {
        "id": str(row.id),
        "slug": row.slug,
        "title": row.title,
        "client_industry": row.client_industry,
        "service_category": row.service_category,
        "domains": list(row.domains or []),
        "headline_metrics": m[:2],
        "software_stack": stack,
        "cover_image_url": row.cover_image_url,
    }


def _etag(payload: str) -> str:
    return 'W/"' + hashlib.sha256(payload.encode()).hexdigest()[:16] + '"'


@router.get("/case-studies")
async def list_studies(
    request: Request,
    response: Response,
    filter: str = "all",
    limit: int = 12,
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):  # type: ignore[no-untyped-def]
    from app.models.tables import CaseStudy

    if filter not in VALID_FILTERS:
        raise HTTPException(status_code=422, detail="validation_error")
    if not (1 <= limit <= 50) or offset < 0:
        raise HTTPException(status_code=422, detail="validation_error")
    q = select(CaseStudy).order_by(CaseStudy.sort_order.asc(), CaseStudy.created_at.desc())
    rows = (await db.execute(q)).scalars().all()
    if filter in ("web", "erp", "ai"):
        rows = [r for r in rows if filter in (r.domains or [])]
    elif filter in ("hardware", "hybrid"):
        rows = [r for r in rows if r.service_category == filter]
    total = len(rows)
    page = rows[offset : offset + limit]
    body = {"success": True, "case_studies": [_summary(r) for r in page], "total": total}
    tag = _etag(json.dumps(body, sort_keys=True, default=str))
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    response.headers["ETag"] = tag
    if request.headers.get("if-none-match") == tag:
        from fastapi.responses import Response as _R

        return _R(status_code=304)
    return body


@router.get("/case-studies/{slug}")
async def get_study(slug: str, request: Request, response: Response, db: AsyncSession = Depends(get_db)):  # type: ignore[no-untyped-def]
    from app.models.tables import CaseStudy

    row = (await db.execute(select(CaseStudy).where(CaseStudy.slug == slug))).scalar_one_or_none()
    if row is None:
        raise HTTPException(status_code=404, detail="not_found")
    base = _summary(row)
    specs = row.hardware_specs or {}
    base.update(
        {
            "problem_statement": row.problem_statement,
            "solution_architecture": row.solution_architecture,
            "metrics": to_metrics(row.metrics or {}),
            "hardware_specs": {k: str(v) for k, v in specs.items()},
            "created_at": row.created_at.isoformat(),
        }
    )
    body = {"success": True, "case_study": base}
    tag = _etag(json.dumps(body, sort_keys=True, default=str))
    response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=300"
    response.headers["ETag"] = tag
    if request.headers.get("if-none-match") == tag:
        from fastapi.responses import Response as _R

        return _R(status_code=304)
    return body
