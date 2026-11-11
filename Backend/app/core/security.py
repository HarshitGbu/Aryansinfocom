from __future__ import annotations

import hashlib
import hmac
import ipaddress
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


def escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def hash_ip(ip: str) -> str:
    salt = get_settings().IP_HASH_SALT
    return hmac.new(salt.encode("utf-8"), ip.encode("utf-8"), hashlib.sha256).hexdigest()


def _is_trusted_proxy(host: str, networks: list[ipaddress.IPv4Network | ipaddress.IPv6Network]) -> bool:
    try:
        addr = ipaddress.ip_address(host)
    except ValueError:
        return False
    if isinstance(addr, ipaddress.IPv6Address) and addr.ipv4_mapped is not None:
        addr = addr.ipv4_mapped
    return any(addr in net for net in networks)


def client_ip(request: Request) -> str:
    if not request.client or not request.client.host:
        return "unknown"
    peer = request.client.host
    try:
        settings = get_settings()
        hops = settings.TRUSTED_PROXY_HOPS
        networks = settings.trusted_proxy_networks
    except Exception:
        hops = 1
        networks = [ipaddress.ip_network("127.0.0.1/32"), ipaddress.ip_network("::1/128")]
    if hops > 0 and _is_trusted_proxy(peer, networks):
        xff = request.headers.get("x-forwarded-for", "")
        if xff:
            parts = [p.strip() for p in xff.split(",") if p.strip()]
            if parts:
                idx = max(0, len(parts) - hops)
                return parts[idx]
    return peer


def verify_admin_key(provided: str) -> bool:
    expected = get_settings().ADMIN_API_KEY
    if not expected or not provided:
        return False
    try:
        return hmac.compare_digest(provided.encode("utf-8"), expected.encode("utf-8"))
    except UnicodeEncodeError:
        return False


def require_admin(request: Request) -> None:
    provided = request.headers.get("x-admin-key", "")
    if not verify_admin_key(provided):
        raise HTTPException(status_code=401, detail="unauthorized")


def verify_hmac(secret: str, body: bytes, signature: str) -> bool:
    if not secret or not signature:
        return False
    digest = hmac.new(secret.encode("utf-8"), body, hashlib.sha256).hexdigest().encode("utf-8")
    # accept "sha256=..." prefix
    sig_str = signature.strip().removeprefix("sha256=")
    try:
        sig = sig_str.encode("utf-8")
    except UnicodeEncodeError:
        return False
    return hmac.compare_digest(digest, sig)
