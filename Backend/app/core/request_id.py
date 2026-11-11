from __future__ import annotations

import json
import re
import time
import uuid

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.config import get_settings

_REQUEST_ID_RE = re.compile(r"[A-Za-z0-9._-]{1,64}")


class RequestIDMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        raw_rid = request.headers.get("x-request-id", "")
        rid = raw_rid if _REQUEST_ID_RE.fullmatch(raw_rid) else uuid.uuid4().hex
        request.state.request_id = rid
        response = await call_next(request)
        response.headers["X-Request-ID"] = rid
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        response = await call_next(request)
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("Referrer-Policy", "no-referrer")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Cross-Origin-Resource-Policy", "same-site")
        try:
            if get_settings().ENVIRONMENT == "production":
                response.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
        except Exception:
            pass
        return response


class BodyLimitMiddleware:
    def __init__(self, app: ASGIApp, max_bytes: int = 65536) -> None:
        self.app = app
        self.max_bytes = max_bytes

    async def _send_json_error(self, send: Send, status: int, code: str, message: str) -> None:
        body = json.dumps({"success": False, "error": {"code": code, "message": message}}).encode("utf-8")
        await send(
            {
                "type": "http.response.start",
                "status": status,
                "headers": [
                    (b"content-type", b"application/json"),
                    (b"content-length", str(len(body)).encode("ascii")),
                ],
            }
        )
        await send({"type": "http.response.body", "body": body, "more_body": False})

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        headers = {k.lower(): v for k, v in scope.get("headers", [])}
        cl_raw = headers.get(b"content-length")
        if cl_raw is not None:
            try:
                cl_val = int(cl_raw.decode("ascii").strip())
            except (UnicodeDecodeError, ValueError):
                await self._send_json_error(send, 400, "validation_error", "Invalid Content-Length")
                return
            if cl_val < 0:
                await self._send_json_error(send, 400, "validation_error", "Invalid Content-Length")
                return
            if cl_val > self.max_bytes:
                await self._send_json_error(send, 413, "payload_too_large", "Request body too large")
                return

        method = str(scope.get("method", "GET")).upper()
        has_body_header = cl_raw is not None or b"transfer-encoding" in headers
        if not has_body_header and method in ("GET", "HEAD", "OPTIONS", "DELETE"):
            await self.app(scope, receive, send)
            return

        chunks: list[bytes] = []
        total = 0
        disconnected = False
        while True:
            message = await receive()
            msg_type = message.get("type")
            if msg_type == "http.disconnect":
                disconnected = True
                break
            if msg_type != "http.request":
                continue
            chunk = message.get("body", b"")
            if chunk:
                total += len(chunk)
                if total > self.max_bytes:
                    await self._send_json_error(send, 413, "payload_too_large", "Request body too large")
                    return
                chunks.append(chunk)
            if not message.get("more_body", False):
                break

        idx = 0
        sent_empty = False

        async def replay_receive() -> Message:
            nonlocal idx, sent_empty
            if idx < len(chunks):
                body = chunks[idx]
                idx += 1
                return {"type": "http.request", "body": body, "more_body": (idx < len(chunks)) or disconnected}
            if not chunks and not sent_empty and not disconnected:
                sent_empty = True
                return {"type": "http.request", "body": b"", "more_body": False}
            if disconnected:
                return {"type": "http.disconnect"}
            return await receive()

        await self.app(scope, replay_receive, send)


class AccessLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
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
