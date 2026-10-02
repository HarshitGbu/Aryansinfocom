FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS base
ENV UV_SYSTEM_PYTHON=1 PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /srv

FROM base AS deps
COPY pyproject.toml uv.lock* ./
RUN --mount=type=cache,target=/root/.cache/uv \
  uv sync --frozen --no-dev || uv pip install --system fastapi "uvicorn[standard]" "sqlalchemy[asyncio]" asyncpg alembic pgvector pydantic pydantic-settings structlog "redis[asyncio]" arq httpx aiosmtplib jinja2 python-multipart email-validator "psycopg[binary]"

FROM base AS runtime
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./
COPY docs ./docs
RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /srv
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
