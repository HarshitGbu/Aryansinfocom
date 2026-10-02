from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any

_redis: Any | None = None


def get_redis_client() -> Any:
    global _redis
    if _redis is not None:
        return _redis
    try:
        import redis.asyncio as aioredis

        from app.config import get_settings

        settings = get_settings()
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
        return _redis
    except Exception:
        return None


async def get_redis() -> AsyncIterator[Any | None]:
    yield get_redis_client()


async def ping_redis() -> bool:
    try:
        client = get_redis_client()
        if client is None:
            return False
        await client.ping()
        return True
    except Exception:
        return False
