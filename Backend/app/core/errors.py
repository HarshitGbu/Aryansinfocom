from __future__ import annotations

from typing import Any

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException


def _details_from_validation(exc: RequestValidationError) -> dict[str, Any]:
    details: dict[str, Any] = {}
    try:
        errs = exc.errors()
        fld: dict[str, list[str]] = {}
        for e in errs:
            loc = ".".join(str(x) for x in e.get("loc", []))
            fld.setdefault(loc or "body", []).append(e.get("msg", "invalid"))
        details = {"fields": fld}
    except Exception:
        details = {}
    return details


def install_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(RequestValidationError)
    async def _validation(request: Request, exc: RequestValidationError) -> JSONResponse:
        rid = getattr(request.state, "request_id", "-")
        import structlog

        structlog.get_logger("api").info("validation_error", request_id=rid, path=request.url.path)
        return JSONResponse(
            status_code=422,
            content={
                "success": False,
                "error": {
                    "code": "validation_error",
                    "message": "Validation failed",
                    "details": _details_from_validation(exc),
                },
            },
        )

    @app.exception_handler(StarletteHTTPException)
    async def _http(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        code_map = {
            401: "unauthorized",
            404: "not_found",
            429: "rate_limited",
            413: "payload_too_large",
            503: "ai_unavailable",
        }
        code = code_map.get(exc.status_code, "internal_error" if exc.status_code >= 500 else "validation_error")
        status = exc.status_code
        msg = str(exc.detail) if exc.detail else code
        # normalize generic admin 401
        if status == 401:
            msg = "unauthorized"
            code = "unauthorized"
        if status == 404 and code != "not_found":
            code = "not_found"
        return JSONResponse(status_code=status, content={"success": False, "error": {"code": code, "message": msg}})

    @app.exception_handler(Exception)
    async def _unhandled(request: Request, exc: Exception) -> JSONResponse:
        rid = getattr(request.state, "request_id", "-")
        import structlog

        structlog.get_logger("api").error(
            "internal_error", request_id=rid, path=request.url.path, error=str(type(exc).__name__)
        )
        return JSONResponse(
            status_code=500,
            content={"success": False, "error": {"code": "internal_error", "message": "Internal server error"}},
        )
