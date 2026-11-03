from __future__ import annotations

import hashlib
import json
from typing import Any

from fastapi import Request, Response

CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300"
_UNSET = object()


def etag(payload: str) -> str:
    return 'W/"' + hashlib.sha256(payload.encode()).hexdigest()[:16] + '"'


def etagged_json(
    request: Request, response: Response, body: dict[str, Any], *, default: Any = _UNSET
) -> Response | dict[str, Any]:
    """Serialize body, set Cache-Control/ETag, and honor If-None-Match with a bare 304."""
    kwargs: dict[str, Any] = {"sort_keys": True}
    if default is not _UNSET:
        kwargs["default"] = default
    tag = etag(json.dumps(body, **kwargs))
    response.headers["Cache-Control"] = CACHE_CONTROL
    response.headers["ETag"] = tag
    if request.headers.get("if-none-match") == tag:
        return Response(status_code=304)
    return body
