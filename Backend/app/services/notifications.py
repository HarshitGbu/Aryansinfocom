from __future__ import annotations

import hashlib

from jinja2 import Environment, select_jinja_autoescape

_env = Environment(autoescape=select_jinja_autoescape(["html"]))

LEAD_STAFF_SUBJECT = "New lead: {{ name }} ({{ email }}) — ${{ mn }}–${{ mx }}"
LEAD_STAFF_HTML = "<p>New lead {{ name }} ({{ email }}) estimate ${{ mn }}–${{ mx }} score {{ score }}.</p>"
LEAD_CONFIRM_SUBJECT = "Your project estimate"
LEAD_CONFIRM_TEXT = (
    "Hi {{ name }}, your estimate is ${{ mn }}–${{ mx }} over {{ tmin }}–{{ tmax }} weeks. Book: {{ booking_url }}"
)


async def _send_email(to: str, subject: str, html: str, text: str) -> None:
    from app.config import get_settings

    settings = get_settings()
    if not settings.SMTP_URL:
        import structlog

        structlog.get_logger("notify").info("email_log", to=to, subject=subject, text=text[:200])
        return
    from email.message import EmailMessage

    import aiosmtplib

    msg = EmailMessage()
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    # SMTP_URL like smtp://host:port (no auth handling beyond basic)
    url = settings.SMTP_URL.replace("smtp://", "").replace("smtps://", "")
    host, _, port = url.partition(":")
    await aiosmtplib.send(msg, hostname=host or "localhost", port=int(port) if port else 25)


async def _send_slack(text: str) -> None:
    import httpx

    from app.config import get_settings

    url = get_settings().SLACK_WEBHOOK_URL
    if not url:
        return
    async with httpx.AsyncClient(timeout=5) as c:
        await c.post(url, json={"text": text})


def _guard_key(kind: str, ident: str) -> str:
    return f"notify:{kind}:{hashlib.sha256(ident.encode()).hexdigest()}"


async def notify_new_lead(lead_id: str, name: str, email: str, mn: int, mx: int, score: int) -> None:
    from app.core.redis import get_redis_client

    r = get_redis_client()
    if r is not None:
        try:
            k = _guard_key("lead", lead_id)
            if not await r.set(k, "1", nx=True, ex=86400):
                return
        except Exception:
            pass
    from app.config import get_settings

    to = get_settings().NOTIFY_EMAIL_TO
    subj = _env.from_string(LEAD_STAFF_SUBJECT).render(name=name, email=email, mn=mn, mx=mx)
    html = _env.from_string(LEAD_STAFF_HTML).render(name=name, email=email, mn=mn, mx=mx, score=score)
    if to:
        await _send_email(to, subj, html, f"New lead {name} estimate ${mn}-${mx}")
    await _send_slack(f"New lead {name} ({email}) ${mn}-${mx} score {score}")


async def notify_new_contact(sub_id: str, name: str, email: str, message: str) -> None:
    from app.core.redis import get_redis_client

    r = get_redis_client()
    if r is not None:
        try:
            k = _guard_key("contact", sub_id)
            if not await r.set(k, "1", nx=True, ex=86400):
                return
        except Exception:
            pass
    from app.config import get_settings

    to = get_settings().NOTIFY_EMAIL_TO
    if to:
        await _send_email(to, f"New contact: {name}", f"<p>{name}: {message[:500]}</p>", f"{name}: {message[:500]}")


async def send_lead_confirmation(lead_id: str, email: str, name: str, mn: int, mx: int, tmin: int, tmax: int) -> None:
    from app.config import get_settings

    booking = get_settings().PUBLIC_BOOKING_URL or ""
    text = _env.from_string(LEAD_CONFIRM_TEXT).render(
        name=name, mn=mn, mx=mx, tmin=tmin, tmax=tmax, booking_url=booking
    )
    await _send_email(email, "Your project estimate", f"<p>{text}</p>", text)
