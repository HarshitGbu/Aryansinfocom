from __future__ import annotations

import argparse
import asyncio


async def _purge(email: str) -> dict[str, int]:
    from sqlalchemy import delete, func

    from app.core.db import get_session_factory
    from app.models.tables import ContactSubmission, LeadEstimate

    factory = get_session_factory()
    async with factory() as s:
        r1 = await s.execute(delete(LeadEstimate).where(func.lower(LeadEstimate.client_email) == email.lower()))
        r2 = await s.execute(delete(ContactSubmission).where(func.lower(ContactSubmission.email) == email.lower()))
        await s.commit()
        return {"leads": r1.rowcount or 0, "contacts": r2.rowcount or 0}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--email", required=True)
    args = ap.parse_args()
    print(asyncio.run(_purge(args.email)))


if __name__ == "__main__":
    main()
