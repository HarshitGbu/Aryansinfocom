from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import router
from app.config import get_settings
from app.core.errors import install_exception_handlers
from app.core.logging import configure_logging
from app.core.rate_limit import rate_limit_middleware
from app.core.request_id import AccessLogMiddleware, BodyLimitMiddleware, RequestIDMiddleware, SecurityHeadersMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[no-untyped-def]
    settings = get_settings()
    settings.ensure_production_ready()
    if settings.ENVIRONMENT == "production":
        # launch gates: placeholder check (best effort, no crash)
        try:
            from sqlalchemy import select

            from app.core.db import get_session_factory
            from app.models.tables import CaseStudy

            factory = get_session_factory()
            async with factory() as s:
                rows = (
                    (await s.execute(select(CaseStudy).where(CaseStudy.is_placeholder).limit(50)))
                    .scalars()
                    .all()
                )  # noqa: E712
                if rows:
                    import structlog

                    structlog.get_logger("startup").warning(
                        "placeholder_case_studies", count=len(rows), slugs=[r.slug for r in rows]
                    )
        except Exception:
            pass
        import structlog

        log = structlog.get_logger("startup")
        for gate in [
            "Replace is_placeholder case studies with real content",
            "Set ADMIN_API_KEY, IP_HASH_SALT, CAL_WEBHOOK_SECRET, SMTP/Slack",
            "Set CORS_ORIGINS to production site only",
            "Review pricing.v1.json and bump version on change",
            "Configure AI provider keys or leave demo in fallback mode",
        ]:
            log.warning("launch_gate", gate=gate)
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.ENVIRONMENT)
    app = FastAPI(title="Agency API", version=settings.version, lifespan=lifespan)
    app.middleware("http")(rate_limit_middleware)
    app.add_middleware(RequestIDMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(AccessLogMiddleware)
    app.add_middleware(BodyLimitMiddleware, max_bytes=65536)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
        allow_headers=["*"],
        allow_credentials=False,
    )
    install_exception_handlers(app)
    app.include_router(router)

    @app.middleware("http")
    async def _hsts(request, call_next):  # type: ignore[no-untyped-def]
        resp = await call_next(request)
        if get_settings().ENVIRONMENT == "production":
            resp.headers.setdefault("Strict-Transport-Security", "max-age=63072000; includeSubDomains")
        return resp

    return app


app = create_app()
