from __future__ import annotations

import time
import uuid

from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import RequestResponseEndpoint
from starlette.responses import Response

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
    "/api/v1/webhooks": (120, 60),
    "/api/v1/admin/": (60, 60),
}

_MAX_MEM_KEYS = 10000

# in-memory fallback when Redis unavailable: {key: [timestamps]}
_mem: dict[str, list[float]] = {}
_mem_expiry: dict[str, float] = {}
_last_prune: float = 0.0

_SLIDING_WINDOW_LUA = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]
local cutoff = now - window

redis.call('ZREMRANGEBYSCORE', key, '-inf', cutoff)
local count = redis.call('ZCARD', key)
if count >= limit then
    local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
    local retry_after = window
    if #oldest >= 2 then
        local oldest_ts = tonumber(oldest[2])
        local rem = window - (now - oldest_ts)
        if rem > 0 then
            retry_after = rem
        else
            retry_after = 1000
        end
    end
    return {0, 0, math.max(1, math.ceil(retry_after / 1000))}
end

redis.call('ZADD', key, now, member)
redis.call('PEXPIRE', key, window + 5000)
local remaining = math.max(0, limit - count - 1)
return {1, remaining, 0}
"""


def _prune_mem(now: float) -> None:
    global _last_prune
    if now - _last_prune < 60.0 and len(_mem) <= 500:
        return
    _last_prune = now
    expired = [k for k, exp in _mem_expiry.items() if exp <= now or not _mem.get(k)]
    for k in expired:
        _mem.pop(k, None)
        _mem_expiry.pop(k, None)
    empty_only = [k for k, v in _mem.items() if not v]
    for k in empty_only:
        _mem.pop(k, None)
        _mem_expiry.pop(k, None)
    if len(_mem) > _MAX_MEM_KEYS:
        overflow = len(_mem) - _MAX_MEM_KEYS
        for k in list(_mem.keys())[:overflow]:
            _mem.pop(k, None)
            _mem_expiry.pop(k, None)


def _match_limit(path: str) -> tuple[str, int, int] | None:
    # longest prefix match; health excluded
    if path in ("/health", "/api/v1/health", "/health/ready", "/api/v1/health/ready"):
        return None
    best: tuple[str, int, int] | None = None
    best_len = -1
    for prefix, lim in LIMITS.items():
        norm = prefix.rstrip("/")
        # exact match or segment-boundary match only (no /api/v1/searchXYZ over-match)
        if path == norm or path.startswith(norm + "/"):
            if len(prefix) > best_len:
                best = (prefix, lim[0], lim[1])
                best_len = len(prefix)
    return best


def _is_write(method: str) -> bool:
    return method.upper() in ("POST", "PATCH", "PUT", "DELETE")


async def rate_limit_middleware(request: Request, call_next: RequestResponseEndpoint) -> Response:
    from app.core.redis import get_redis_client
    from app.core.security import client_ip

    path = request.url.path
    # strip nothing; match directly
    matched = _match_limit(path)
    if matched is None:
        return await call_next(request)
    prefix, limit, window = matched
    # special: rag also has daily budget
    ip = client_ip(request)
    # bucket by the matched config prefix so a shared prefix budget is real
    # (e.g. /api/v1/services and /api/v1/services/{slug} share one budget)
    key = f"rl:{prefix}:{ip}"
    now = time.time()
    redis = get_redis_client()
    remaining = limit
    retry_after = 0
    allowed = True
    if redis is not None:
        try:
            now_ms = int(now * 1000)
            window_ms = window * 1000
            member = f"{now_ms}:{uuid.uuid4().hex}"
            res = await redis.eval(_SLIDING_WINDOW_LUA, 1, key, str(now_ms), str(window_ms), str(limit), member)
            allowed = bool(int(res[0]))
            remaining = int(res[1])
            retry_after = int(res[2])
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
        # in-memory fallback (dev/test): check first, record only when allowed
        _prune_mem(now)
        lst = [t for t in _mem.get(key, []) if t > now - window]
        if not lst:
            _mem.pop(key, None)
            _mem_expiry.pop(key, None)
        if len(lst) >= limit:
            retry_after = int(max(1, window - (now - lst[0]))) if lst else window
            _mem[key] = lst
            _mem_expiry[key] = lst[0] + window
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
        lst.append(now)
        _mem[key] = lst
        _mem_expiry[key] = now + window
        remaining = max(0, limit - len(lst))
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
    return resp
