from __future__ import annotations

import json
from pathlib import Path


def main() -> None:
    from app.main import create_app

    app = create_app()
    spec = app.openapi()
    out = Path("docs/openapi.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(spec, indent=2), encoding="utf-8")
    print(f"wrote {out} paths={len(spec.get('paths', {}))}")


if __name__ == "__main__":
    main()
