from __future__ import annotations

import hashlib
import re
from dataclasses import dataclass
from urllib.parse import parse_qs, unquote, urlparse

from jinja2 import Environment, select_autoescape

_text_env = Environment(autoescape=False)
_html_env = Environment(autoescape=select_autoescape(["html", "htm", "xml"], default_for_string=True))

LEAD_STAFF_SUBJECT = "New lead: {{ name }} ({{ email }}) — ${{ mn }}–${{ mx }}"
LEAD_STAFF_HTML = "<p>New lead {{ name }} ({{ email }}) estimate ${{ mn }}–${{ mx }} score {{ score }}.</p>"
LEAD_STAFF_TEXT = "New lead {{ name }} estimate ${{ mn }}-${{ mx }}"
CONTACT_SUBJECT = "New contact: {{ name }}"
CONTACT_HTML = "<p>{{ name }} ({{ email }}): {{ message }}</p>"
CONTACT_TEXT = "{{ name }} ({{ email }}): {{ message }}"
LEAD_CONFIRM_SUBJECT = "Your project estimate"
LEAD_CONFIRM_TEXT = (
    "Hi {{ name }}, your estimate is ${{ mn }}–${{ mx }} over {{ tmin }}–{{ tmax }} weeks. Book: {{ booking_url }}"
)
LEAD_CONFIRM_HTML = (
    "<p>Hi {{ name }}, your estimate is ${{ mn }}–${{ mx }} over {{ tmin }}–{{ tmax }} weeks."
    " Book: {{ booking_url }}</p>"
)


@dataclass(frozen=True, slots=True)
class SmtpConfig:
    host: str
    port: int
    username: str | None
    password: str | None
    use_tls: bool
    start_tls: bool | None


def _sanitize_header(value: str, *, replace_with: str = " ") -> str:
    return re.sub(r"[\r\n\x00-\x1f\x7f]+", replace_with, value).strip()


def _escape_slack(value: str) -> str:
    return value.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def parse_smtp_url(smtp_url: str) -> SmtpConfig:
    raw = smtp_url.strip()
    if "://" not in raw:
        raw = f"smtp://{raw}"
    parsed = urlparse(raw)
    scheme = parsed.scheme.lower()
    if scheme not in ("smtp", "smtps", "smtp+starttls"):
        raise ValueError(f"Unsupported SMTP scheme: {scheme}")
    host = parsed.hostname or "localhost"
    username = unquote(parsed.username) if parsed.username is not None else None
    password = unquote(parsed.password) if parsed.password is not None else None
    use_tls = scheme == "smtps"
    qs = parse_qs(parsed.query)
    start_tls: bool | None
    if use_tls:
        start_tls = False
    elif scheme == "smtp+starttls":
        start_tls = True
    elif "starttls" in qs or "tls" in qs:
        val = (qs.get("starttls") or qs.get("tls") or [""])[-1].strip().lower()
        start_tls = val in ("1", "true", "yes", "on")
    elif parsed.port == 587:
        start_tls = True
    else:
        start_tls = None
    port = parsed.port if parsed.port is not None else (465 if use_tls else (587 if start_tls else 25))
    return SmtpConfig(
        host=host,
        port=port,
        username=username,
        password=password,
        use_tls=use_tls,
        start_tls=start_tls,
    )


async def _send_email(to: str, subject: str, html: str, text: str) -> None:
    from app.config import get_settings

    settings = get_settings()
    to_clean = _sanitize_header(to, replace_with="")
    subject_clean = _sanitize_header(subject)
    if not to_clean:
        return
    if not settings.SMTP_URL:
        import structlog

        structlog.get_logger("notify").info("email_log", to=to_clean, subject=subject_clean, text=text[:200])
        return
    from email.message import EmailMessage

    import aiosmtplib

    cfg = parse_smtp_url(settings.SMTP_URL)
    fallback_domain = cfg.host if cfg.host and ":" not in cfg.host else "localhost"
    from_raw = (
        getattr(settings, "SMTP_FROM", "")
        or settings.NOTIFY_EMAIL_TO
        or (cfg.username if cfg.username and "@" in cfg.username else "")
        or f"noreply@{fallback_domain}"
    )
    from_clean = _sanitize_header(from_raw, replace_with="") or "noreply@localhost"

    msg = EmailMessage()
    msg["From"] = from_clean
    msg["To"] = to_clean
    msg["Subject"] = subject_clean
    msg.set_content(text)
    msg.add_alternative(html, subtype="html")
    await aiosmtplib.send(
        msg,
        hostname=cfg.host,
        port=cfg.port,
        username=cfg.username,
        password=cfg.password,
        use_tls=cfg.use_tls,
        start_tls=cfg.start_tls,
    )


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
    subj = _sanitize_header(_text_env.from_string(LEAD_STAFF_SUBJECT).render(name=name, email=email, mn=mn, mx=mx))
    html = _html_env.from_string(LEAD_STAFF_HTML).render(name=name, email=email, mn=mn, mx=mx, score=score)
    text = _text_env.from_string(LEAD_STAFF_TEXT).render(name=name, email=email, mn=mn, mx=mx, score=score)
    if to:
        await _send_email(to, subj, html, text)
    await _send_slack(f"New lead {_escape_slack(name)} ({_escape_slack(email)}) ${mn}-${mx} score {score}")


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
        snippet = message[:500]
        subj = _sanitize_header(_text_env.from_string(CONTACT_SUBJECT).render(name=name))
        html = _html_env.from_string(CONTACT_HTML).render(name=name, email=email, message=snippet)
        text = _text_env.from_string(CONTACT_TEXT).render(name=name, email=email, message=snippet)
        await _send_email(to, subj, html, text)


async def send_lead_confirmation(lead_id: str, email: str, name: str, mn: int, mx: int, tmin: int, tmax: int) -> None:
    from app.config import get_settings

    booking = get_settings().PUBLIC_BOOKING_URL or ""
    text = _text_env.from_string(LEAD_CONFIRM_TEXT).render(
        name=name, mn=mn, mx=mx, tmin=tmin, tmax=tmax, booking_url=booking
    )
    html = _html_env.from_string(LEAD_CONFIRM_HTML).render(
        name=name, mn=mn, mx=mx, tmin=tmin, tmax=tmax, booking_url=booking
    )
    await _send_email(email, LEAD_CONFIRM_SUBJECT, html, text)
