from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import escape_like
from app.services.search import ACTIONS, PAGES, rank_static

router = APIRouter(tags=["search"])


@router.get("/search")
async def search(
    q: str = Query(default="", max_length=200), limit: int = 8, db: AsyncSession = Depends(get_db)
) -> Any:
    if len(q.strip()) < 2:
        raise HTTPException(status_code=422, detail="validation_error")
    if not (1 <= limit <= 20):
        raise HTTPException(status_code=422, detail="validation_error")
    from fastapi.responses import JSONResponse
    from sqlalchemy import or_, select

    from app.models.tables import CaseStudy, Service

    qn = q.strip()
    escaped_q = escape_like(qn)
    results: list[dict[str, Any]] = []
    # static first
    results += rank_static(qn, PAGES, "page")[:3]
    results += rank_static(qn, ACTIONS, "action")[:3]
    # db services: ILIKE + FTS-ish (title/summary)
    try:
        srows = (
            (
                await db.execute(
                    select(Service)
                    .where(
                        or_(
                            Service.title.ilike(f"%{escaped_q}%", escape="\\"),
                            Service.short_description.ilike(f"%{escaped_q}%", escape="\\"),
                        )
                    )
                    .order_by(Service.sort_order.asc())
                    .limit(10)
                )
            )
            .scalars()
            .all()
        )

        # ranking exact>prefix>contains
        def _rk(t: str) -> int:
            tl, ql = t.lower(), qn.lower()
            if tl == ql:
                return 0
            if tl.startswith(ql):
                return 1
            return 2

        srows = sorted(srows, key=lambda r: (_rk(r.title), r.sort_order))[:3]
        for sr in srows:
            results.append(
                {
                    "type": "service",
                    "title": sr.title,
                    "subtitle": sr.short_description[:120],
                    "href": f"/services/{sr.slug}",
                }
            )
    except Exception:
        pass
    try:
        crows = (
            (
                await db.execute(
                    select(CaseStudy)
                    .where(
                        or_(
                            CaseStudy.title.ilike(f"%{escaped_q}%", escape="\\"),
                            CaseStudy.problem_statement.ilike(f"%{escaped_q}%", escape="\\"),
                        )
                    )
                    .order_by(CaseStudy.sort_order.asc())
                    .limit(10)
                )
            )
            .scalars()
            .all()
        )
        crows = sorted(
            crows,
            key=lambda r: (
                0 if r.title.lower() == qn.lower() else (1 if r.title.lower().startswith(qn.lower()) else 2),
                r.sort_order,
            ),
        )[:3]
        for cr in crows:
            results.append(
                {"type": "case_study", "title": cr.title, "subtitle": cr.client_industry, "href": f"/work/{cr.slug}"}
            )
    except Exception:
        pass
    # interleave: exact service/case first? keep order: exact title matches first
    results = results[:limit]
    resp = JSONResponse(content={"success": True, "results": results})
    resp.headers["Cache-Control"] = "no-store"
    return resp
