from __future__ import annotations

from fastapi import APIRouter
from sqlalchemy import select

from app.config import get_settings
from app.core.db import get_engine
from app.core.redis import ping_redis

router = APIRouter(tags=["health"])


@router.get("/health")
async def health():  # type: ignore[no-untyped-def]
    return {"success": True, "status": "ok", "version": get_settings().version}


@router.get("/health/ready")
async def ready():  # type: ignore[no-untyped-def]
    from fastapi.responses import JSONResponse

    db_ok = False
    try:
        eng = get_engine()
        async with eng.connect() as c:
            await c.execute(select(1))
        db_ok = True
    except Exception:
        db_ok = False
    redis_ok = await ping_redis()
    status = "ready" if (db_ok and redis_ok) else "degraded"
    code = 200 if status == "ready" else 503
    return JSONResponse(
        status_code=code,
        content={"success": status == "ready", "status": status, "checks": {"database": db_ok, "redis": redis_ok}},
    )
