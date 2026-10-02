from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.services.search import ACTIONS, PAGES, rank_static

router = APIRouter(tags=["search"])


@router.get("/search")
async def search(q: str = "", limit: int = 8, db: AsyncSession = Depends(get_db)):  # type: ignore[no-untyped-def]
    if len(q.strip()) < 2:
        raise HTTPException(status_code=422, detail="validation_error")
    if not (1 <= limit <= 20):
        raise HTTPException(status_code=422, detail="validation_error")
    from fastapi.responses import JSONResponse
    from sqlalchemy import or_, select

    from app.models.tables import CaseStudy, Service

    qn = q.strip()
    results: list[dict] = []
    # static first
    results += rank_static(qn, PAGES, "page")[:3]
    results += rank_static(qn, ACTIONS, "action")[:3]
    # db services: ILIKE + FTS-ish (title/summary)
    try:
        srows = (
            (
                await db.execute(
                    select(Service)
                    .where(or_(Service.title.ilike(f"%{qn}%"), Service.short_description.ilike(f"%{qn}%")))
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
        for r in srows:
            results.append(
                {
                    "type": "service",
                    "title": r.title,
                    "subtitle": r.short_description[:120],
                    "href": f"/services/{r.slug}",
                }
            )
    except Exception:
        pass
    try:
        crows = (
            (
                await db.execute(
                    select(CaseStudy)
                    .where(or_(CaseStudy.title.ilike(f"%{qn}%"), CaseStudy.problem_statement.ilike(f"%{qn}%")))
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
        for r in crows:
            results.append(
                {"type": "case_study", "title": r.title, "subtitle": r.client_industry, "href": f"/work/{r.slug}"}
            )
    except Exception:
        pass
    # interleave: exact service/case first? keep order: exact title matches first
    results = results[:limit]
    resp = JSONResponse(content={"success": True, "results": results})
    resp.headers["Cache-Control"] = "no-store"
    return resp
