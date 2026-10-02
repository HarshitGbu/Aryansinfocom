from __future__ import annotations

import json

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


def canonical_json(obj: object) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
