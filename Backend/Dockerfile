FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_LINK_MODE=copy
WORKDIR /srv

FROM base AS deps
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
  uv sync --frozen --no-dev --no-install-project

FROM base AS runtime
COPY --from=deps /srv/.venv /srv/.venv
ENV PATH="/srv/.venv/bin:$PATH"
COPY app ./app
COPY migrations ./migrations
COPY alembic.ini ./
COPY docs ./docs
RUN useradd -m -u 10001 appuser && chown -R appuser:appuser /srv
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
