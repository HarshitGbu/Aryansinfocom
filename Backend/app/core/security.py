from __future__ import annotations

import hashlib
import hmac
from typing import Any

from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse

from app.config import get_settings


def error_envelope(code: str, message: str, details: Any | None = None) -> dict[str, Any]:
    err: dict[str, Any] = {"code": code, "message": message}
    if details is not None:
        err["details"] = details
    return {"success": False, "error": err}


def error_response(status: int, code: str, message: str, details: Any | None = None) -> JSONResponse:
    return JSONResponse(status_code=status, content=error_envelope(code, message, details))


def hash_ip(ip: str) -> str:
    salt = get_settings().IP_HASH_SALT
    return hashlib.sha256(f"{ip}{salt}".encode()).hexdigest()


def client_ip(request: Request) -> str:
    try:
        hops = get_settings().TRUSTED_PROXY_HOPS
    except Exception:
        hops = 1
    xff = request.headers.get("x-forwarded-for", "")
    if xff and hops > 0:
        parts = [p.strip() for p in xff.split(",") if p.strip()]
        if parts:
            idx = max(0, len(parts) - hops)
            return parts[idx]
    if request.client:
        return request.client.host
    return "unknown"


def verify_admin_key(provided: str) -> bool:
    expected = get_settings().ADMIN_API_KEY
    if not expected or not provided:
        return False
    return hmac.compare_digest(provided, expected)


def require_admin(request: Request) -> None:
    provided = request.headers.get("x-admin-key", "")
    if not verify_admin_key(provided):
        raise HTTPException(status_code=401, detail="unauthorized")


def verify_hmac(secret: str, body: bytes, signature: str) -> bool:
    if not secret:
        return False
    digest = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    # accept "sha256=..." prefix
    sig = signature.removeprefix("sha256=")
    return hmac.compare_digest(digest, sig)
