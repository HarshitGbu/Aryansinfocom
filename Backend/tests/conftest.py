from __future__ import annotations

import os

import pytest


@pytest.fixture()
def anyio_backend():  # type: ignore[no-untyped-def]
    return "asyncio"


def _test_env() -> None:
    os.environ.setdefault("ENVIRONMENT", "test")
    os.environ.setdefault("IP_HASH_SALT", "test-salt-1234567890")
    os.environ.setdefault("ADMIN_API_KEY", "test-admin-key-0123456789abcdef01")


_test_env()
