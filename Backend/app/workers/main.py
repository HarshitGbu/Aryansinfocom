from __future__ import annotations

from arq.connections import RedisSettings


async def notify_new_lead_task(ctx: dict, lead_id: str) -> None:
    from sqlalchemy import select

    from app.core.db import get_session_factory
    from app.models.tables import LeadEstimate
    from app.services.notifications import notify_new_lead

    factory = get_session_factory()
    async with factory() as s:
        lead = (
            (await s.execute(select(LeadEstimate).where(LeadEstimate.id == lead_id))).scalar_one_or_none()
            if _is_uuid(lead_id)
            else None
        )
        # fallback: lookup by string id
        if lead is None:

            res = await s.execute(select(LeadEstimate).where(LeadEstimate.id == lead_id))  # type: ignore[arg-type]
            lead = res.scalar_one_or_none()
        if lead is None:
            return
        await notify_new_lead(
            str(lead.id),
            lead.client_name,
            lead.client_email,
            lead.estimated_budget_min,
            lead.estimated_budget_max,
            lead.lead_score,
        )


async def notify_new_contact_task(ctx: dict, submission_id: str) -> None:

    from app.core.db import get_session_factory
    from app.models.tables import ContactSubmission
    from app.services.notifications import notify_new_contact

    factory = get_session_factory()
    async with factory() as s:
        row = await s.get(ContactSubmission, submission_id)  # type: ignore[arg-type]
        if row is None:
            return
        await notify_new_contact(str(row.id), row.name, row.email, row.message)


async def send_lead_confirmation_task(ctx: dict, lead_id: str) -> None:

    from app.core.db import get_session_factory
    from app.models.tables import LeadEstimate
    from app.services.notifications import send_lead_confirmation

    factory = get_session_factory()
    async with factory() as s:
        lead = await s.get(LeadEstimate, lead_id)  # type: ignore[arg-type]
        if lead is None:
            return
        await send_lead_confirmation(
            str(lead.id),
            lead.client_email,
            lead.client_name,
            lead.estimated_budget_min,
            lead.estimated_budget_max,
            lead.estimated_timeline_weeks_min or lead.estimated_timeline_weeks,
            lead.estimated_timeline_weeks,
        )


def _is_uuid(v: str) -> bool:
    try:
        import uuid

        uuid.UUID(str(v))
        return True
    except Exception:
        return False


class WorkerSettings:
    functions = [notify_new_lead_task, notify_new_contact_task, send_lead_confirmation_task]
    redis_settings = RedisSettings()
    max_tries = 4
    retry_jobs = True
