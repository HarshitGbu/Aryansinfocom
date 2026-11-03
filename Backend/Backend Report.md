# Backend Report — Aryan Infocom Website

Date: 2026-10-02. Status: **M0–M7 done, M8 partial**. Contract: `backend_engineering_prompt_aiweb.md` Appendix A.

## 1. Summary

FastAPI backend (Python 3.12) with Postgres + pgvector, Redis, ARQ worker. Implements content APIs, deterministic estimator + lead capture, AI Lab (RAG + prompt parser), search, webhooks, admin, hardening. Verified today: **12/12 unit + contract tests pass**, `ruff` clean, `docs/openapi.json` has **17 paths**. Full suite: 14 passed / 8 integration failed — all 8 fail on `socket.gaierror` (no Postgres/Redis running in this environment), not code errors.

## 2. Stack and layout

- FastAPI, SQLAlchemy 2.0 async + asyncpg + Alembic, pgvector `VECTOR(1536)` HNSW, Redis + ARQ, uv, Pydantic v2, structlog, pytest.
- `app/main.py` (factory/lifespan/middleware), `app/config.py`, `app/core/` (db, redis, logging, errors, security, rate_limit, request_id), `app/models/tables.py` (6 tables), `app/schemas/` (Appendix A mirrors), `app/api/v1/` (9 routers), `app/services/pricing/` + `lead_scoring.py` + `prompt_parser.py` + `search.py` + `notifications.py` + `rag/`, `app/workers/main.py`, `app/seed/` + `data/*.json`, `migrations/versions/0001_core.py` + `0002_additions.py`.

## 3. Endpoints (17 paths in `docs/openapi.json`)

| Method | Path | Notes |
|---|---|---|
| GET | `/health`, `/health/ready` | liveness; readiness (DB+Redis, 503 degraded) |
| GET | `/api/v1/services`, `/services/{slug}` | filter `category`, ETag/304, 120/min |
| GET | `/api/v1/case-studies`, `/case-studies/{slug}` | filter `all/web/erp/ai/hardware/hybrid`, limit/offset, MetricItem humanize, ETag/304 |
| GET | `/api/v1/hardware-blueprints`, `/hardware-blueprints/{code}` | 4 tiers incl. `BLUEPRINT-AIRGAP-25` (6 zones/7 links) |
| POST | `/api/v1/estimate/calculate` | stateless, golden A.4 exact, 30/min |
| POST | `/api/v1/estimate/submit` | recalc + honeypot + 10-min dedupe + ARQ jobs, 5/10min |
| POST | `/api/v1/contact` | honeypot + enqueue, 5/10min |
| POST | `/api/v1/playground/rag-simulation` | 5 timed stages, live/cached/fallback, 10/min |
| POST | `/api/v1/playground/prompt-parse` | rule-based intents/guardrails/routing, 20/min |
| GET | `/api/v1/search` | pages+actions+DB, ranked, `q>=2`, 60/min |
| POST | `/api/v1/webhooks/cal` | HMAC-SHA256, idempotent `discovery_booked` |
| GET/PATCH | `/api/v1/admin/leads`, `/admin/leads/{id}` | `X-Admin-Key`, 401 generic |

## 4. Features done (M0–M7)

- M0 scaffold: compose (api/worker/postgres/redis), Dockerfile non-root, Makefile, CI skeleton.
- M1 DB: extensions `uuid-ossp`/`vector`/`pg_trgm`; seed idempotent (4 services, 6 placeholder studies, 4 blueprints, 22 KB chunks incl. required VLAN-30 chunk); migrate/downgrade clean, double-seed no-change.
- M2 content: ordering, 422/404, headline metrics, `Cache-Control` + weak ETag + 304.
- M3 estimator: pure engine, per-line nearest-50 rounding before sum, timeline `max+buffer`, blueprint 10/25 switches; golden `18500–27000 / 6–10` verified via HTTP.
- M4 leads: honeypot fake-200, server recalc, canonical-hash dedupe, `consent_at`/`ip_hash`/`score`/`version`, ARQ (guard + backoff + SMTP-or-log + Slack), Cal webhook, admin.
- M5 search + parser: static registry + ILIKE/trgm, 26 parser table cases pass.
- M6 RAG: `perf_counter` timings, `total_ms`, cached 24h Redis, fallback lexical + extractive with honest `Skipped (demo mode)`, injection stays grounded.
- M7 hardening: sliding-window limits + `Retry-After`/`X-RateLimit-*` (prod fail-open GET/fail-closed POST; dev/test in-memory fallback), security headers + prod HSTS, CORS allowlist, 64KB → 413, IP hashing, no PII in logs, `purge-lead`.

## 5. Test report (verified 2026-10-02)

- `uv run pytest tests/unit tests/contract`: **12 passed**.
- `uv run pytest` (full): **14 passed, 8 failed** — every failure is `socket.gaierror` in `tests/integration/test_api.py` (needs live Postgres at `postgres:5432` + Redis); rerun with `docker compose up -d postgres redis` should clear them.
- `uv run ruff check app tests`: **clean**.
- Coverage (full run): **58% total** (target 85%); pricing 94% (target 95%). Gap is untested notifications/RAG providers/workers/seed.
- `mypy --strict`: 89 errors pending (mostly `Any` generics) — see `docs/DEVIATIONS.md`.

## 6. Run

```bash
cp .env.example .env
docker compose up --build
curl http://localhost:8000/health
```

`make migrate | seed | openapi | test | lint | typecheck`, `make purge-lead EMAIL=...`, docs at `/docs`, frontend types via `docs/openapi.json`. Launch gates (prod): replace placeholder studies, real secrets/SMTP/Slack, prod-only CORS, review `pricing.v1.json` + bump version, AI keys or keep fallback.

## 7. Remaining (M8)

1. Integration green with live infra + coverage to 85%/95%.
2. `mypy --strict` cleanup.
3. Final `openapi.json` regen + `/docs` browser check.

Details: `PROJECT_PROGRESS.md`, `docs/PROGRESS.md`, deviations: `docs/DEVIATIONS.md`.
