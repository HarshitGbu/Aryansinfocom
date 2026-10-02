from __future__ import annotations

import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        rid = request.headers.get("x-request-id") or str(uuid.uuid4())
        request.state.request_id = rid
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-site")
        # HSTS only in production; main.py sets env-aware value
        return response


class BodyLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: object, max_bytes: int = 65536) -> None:
        super().__init__(app)  # type: ignore[arg-type]
        self.max_bytes = max_bytes

    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        cl = request.headers.get("content-length")
        if cl and cl.isdigit() and int(cl) > self.max_bytes:
            from starlette.responses import JSONResponse

            return JSONResponse(
                status_code=413,
                content={"success": False, "error": {"code": "payload_too_large", "message": "Request body too large"}},
            )
        # also guard chunked bodies
        body = await request.body()

        async def _receive():  # type: ignore[no-untyped-def]
            return {"type": "http.request", "body": body, "more_body": False}

        request._receive = _receive  # type: ignore[attr-defined]
        if len(body) > self.max_bytes:
            from starlette.responses import JSONResponse

            return JSONResponse(
                status_code=413,
                content={"success": False, "error": {"code": "payload_too_large", "message": "Request body too large"}},
            )
        response = await call_next(request)
        return response


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:  # type: ignore[no-untyped-def]
        start = time.perf_counter()
        response = await call_next(request)
        dur_ms = (time.perf_counter() - start) * 1000
        try:
            import structlog

            log = structlog.get_logger("access")
            # never log PII headers
            log.info(
                "request",
                request_id=getattr(request.state, "request_id", "-"),
                method=request.method,
                path=request.url.path,
                status=response.status_code,
                duration_ms=round(dur_ms, 2),
            )
        except Exception:
            pass
        return response
