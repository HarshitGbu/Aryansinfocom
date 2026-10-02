from __future__ import annotations

import time

from fastapi import Request
from fastapi.responses import JSONResponse

LIMITS: dict[str, tuple[int, int]] = {
    # prefix -> (limit, window_seconds)
    "/api/v1/services": (120, 60),
    "/api/v1/case-studies": (120, 60),
    "/api/v1/hardware-blueprints": (120, 60),
    "/api/v1/estimate/calculate": (30, 60),
    "/api/v1/estimate/submit": (5, 600),
    "/api/v1/contact": (5, 600),
    "/api/v1/playground/rag-simulation": (10, 60),
    "/api/v1/playground/prompt-parse": (20, 60),
    "/api/v1/search": (60, 60),
    "/api/v1/admin/": (60, 60),
}

# in-memory fallback when Redis unavailable: {key: [timestamps]}
_mem: dict[str, list[float]] = {}


def _match_limit(path: str) -> tuple[int, int] | None:
    # longest prefix match; health/webhooks excluded
    if path in ("/health", "/api/v1/health", "/health/ready", "/api/v1/health/ready"):
        return None
    if path.startswith("/api/v1/webhooks/"):
        return None
    best: tuple[int, int] | None = None
    best_len = -1
    for prefix, lim in LIMITS.items():
        if path == prefix or path.startswith(prefix.rstrip("/") + "/") or path.startswith(prefix):
            if len(prefix) > best_len:
                best = lim
                best_len = len(prefix)
    return best


def _is_write(method: str) -> bool:
    return method.upper() in ("POST", "PATCH", "PUT", "DELETE")


async def rate_limit_middleware(request: Request, call_next):  # type: ignore[no-untyped-def]
    from app.core.redis import get_redis_client
    from app.core.security import client_ip

    path = request.url.path
    # strip nothing; match directly
    lim = _match_limit(path)
    if lim is None:
        return await call_next(request)
    limit, window = lim
    # special: rag also has daily 100/day
    ip = client_ip(request)
    key = f"rl:{path}:{ip}"
    now = time.time()
    redis = get_redis_client()
    remaining = limit
    retry_after = 0
    allowed = True
    if redis is not None:
        try:
            # sliding window via sorted set
            member = f"{now}:{ip}"
            pipe = redis.pipeline()
            pipe.zremrangebyscore(key, 0, now - window)
            pipe.zadd(key, {member: now})
            pipe.zcard(key)
            pipe.expire(key, window + 5)
            res = await pipe.execute()
            count = int(res[2])
            remaining = max(0, limit - count)
            if count > limit:
                allowed = False
                # oldest within window
                oldest = await redis.zrange(key, 0, 0, withscores=True)
                if oldest:
                    retry_after = int(max(1, window - (now - float(oldest[0][1]))))
                else:
                    retry_after = window
        except Exception:
            redis = None  # fall through to fail-open/closed
    if redis is None:
        # Redis unavailable: log loudly; in non-production use in-memory sliding window
        # so local dev/test without Redis still works. In production, fail open for
        # reads and fail closed for writes per spec.
        import structlog

        from app.config import get_settings

        structlog.get_logger("ratelimit").error("redis_unavailable", path=path, method=request.method)
        try:
            env = get_settings().ENVIRONMENT
        except Exception:
            env = "development"
        if env == "production" and _is_write(request.method):
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {
                        "code": "rate_limited",
                        "message": "Service busy, try again later",
                        "details": {"retry_after_seconds": 30},
                    },
                },
                headers={"Retry-After": "30", "X-RateLimit-Limit": str(limit), "X-RateLimit-Remaining": "0"},
            )
        if env == "production" and not _is_write(request.method):
            # fail open for reads
            resp = await call_next(request)
            resp.headers["X-RateLimit-Limit"] = str(limit)
            resp.headers["X-RateLimit-Remaining"] = str(limit)
            return resp
        # in-memory fallback (dev/test)
        lst = _mem.get(key, [])
        lst = [t for t in lst if t > now - window]
        lst.append(now)
        _mem[key] = lst
        count = len(lst)
        remaining = max(0, limit - count)
        if count > limit:
            retry_after = int(max(1, window - (now - lst[0])))
            return JSONResponse(
                status_code=429,
                content={
                    "success": False,
                    "error": {
                        "code": "rate_limited",
                        "message": "Rate limit exceeded",
                        "details": {"retry_after_seconds": retry_after},
                    },
                },
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(limit),
                    "X-RateLimit-Remaining": "0",
                },
            )
        resp = await call_next(request)
        resp.headers["X-RateLimit-Limit"] = str(limit)
        resp.headers["X-RateLimit-Remaining"] = str(remaining)
        return resp
    if not allowed:
        # extra daily check for rag handled in endpoint; here per-min only
        return JSONResponse(
            status_code=429,
            content={
                "success": False,
                "error": {
                    "code": "rate_limited",
                    "message": "Rate limit exceeded",
                    "details": {"retry_after_seconds": retry_after},
                },
            },
            headers={
                "Retry-After": str(retry_after),
                "X-RateLimit-Limit": str(limit),
                "X-RateLimit-Remaining": "0",
            },
        )
    resp = await call_next(request)
    resp.headers["X-RateLimit-Limit"] = str(limit)
    resp.headers["X-RateLimit-Remaining"] = str(remaining)
    # ensure X-Request-ID present even on errors handled upstream? main middleware covers
    return resp
