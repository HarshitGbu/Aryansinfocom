# Implementation Plan — Tech Agency Platform API (M0–M8)

Base path: `/api/v1`. Contract: Appendix A is law.
Stack: Python 3.12 + FastAPI, SQLAlchemy 2.0 async + Alembic, pgvector VECTOR(1536) HNSW, Redis + ARQ, uv, Pydantic v2, structlog, pytest.

## M0 — Scaffold
- `pyproject.toml` (uv, ruff, mypy strict on app/, pytest), `uv.lock`, `Dockerfile` (multi-stage, non-root), `docker-compose.yml` (api, worker, postgres pgvector:pg16, redis), `Makefile`, `.env.example`, `README.md`, `alembic.ini`
- `app/main.py` (factory, lifespan, middleware, exception handlers), `app/config.py` (pydantic-settings, prod refuse-to-start), `app/core/*` (db, redis, logging, errors, security, rate_limit, request_id)
- Health endpoints `GET /health`, `GET /health/ready` (no rate limit, envelope)
- CI skeleton `.github/workflows/ci.yml` (ruff, mypy, pytest, openapi diff, audit)
- Acceptance: `docker compose up` → `/health` 200, CI green

## M1 — Database
- Models match §6.1 exact + §6.2 additions; extensions `uuid-ossp`, `vector`, `pg_trgm`
- Alembic: `0001_extensions_core` (5 tables), `0002_additions_indexes` (adds + contact_submissions + tsv + HNSW + indexes + updated_at trigger)
- `app/seed/data/*.json` + `app/seed/seed.py` idempotent upserts; WARNING log for `is_placeholder` in prod
- `make migrate / seed / purge-lead`; startup placeholder warning
- Acceptance: migrations apply + rollback clean on fresh DB; seed twice = zero changes

## M2 — Content API
- `GET /services`, `/services/{slug}`, `/case-studies` (filter=all|web|erp|ai|hardware|hybrid, limit/offset), `/case-studies/{slug}`, `/hardware-blueprints`, `/hardware-blueprints/{code}`
- Ordering `sort_order ASC, created_at DESC`; unknown filter→422, unknown slug/code→404
- MetricItem serialization (humanize label, headline first-two), Cache-Control + weak ETag + If-None-Match 304, envelope+errors
- Tests: happy + 404 + 422 + ETag/304

## M3 — Estimator
- `app/services/pricing/pricing.v1.json` (exact §8.1) + `engine.py` pure fns (no I/O), rounding nearest-50 half-up before sum, §8.2 steps 1–10
- `POST /estimate/calculate` (30/min, no-store, strict ints, 422 details)
- `docs/openapi.json` generation; verify `/docs` in browser
- Tests `tests/unit/test_pricing.py`: golden A.4, singles/pairs/all-six, 200 seeded rounding property, monotonicity, boundaries (0/max, infra w/o workstations 422, 11/26 blueprint switches, min≤max)

## M4 — Leads
- `POST /estimate/submit` (recalculate server-side, honeypot 200 fake-success + log, dedupe email+canonical-hash 10min, store consent/ip_hash/scores/version, enqueue jobs, Redis-down still 200)
- `POST /contact` (same honeypot/consent/hash/enqueue → contact_submissions)
- `POST /webhooks/cal` (HMAC-SHA256 raw-body, constant-time, 404 if no secret, idempotent booked_at/status, unknown email 200)
- `GET /admin/leads` (filter/limit/offset newest-first) + `PATCH /admin/leads/{id}` (X-Admin-Key constant-time, 401 generic, rate-limited)
- ARQ `app/workers/main.py`: notify_new_lead, notify_new_contact, send_lead_confirmation (idempotent Redis guard, 3× backoff, SMTP or log, Slack webhook, Jinja2 autoescape, no ids/scores to visitor)
- Lead scoring 0–100 capped (§8.4); unit-test each rule

## M5 — Search + Prompt parser
- `GET /search?q=&limit=` (q≥2 else 422, static pages+actions registry, FTS + ILIKE/trgm fallback, ranking exact>prefix>FTS>alias, max 3/type, hrefs /services/{slug} /work/{slug}, no-store, p95<60ms)
- `POST /playground/prompt-parse` rule-based deterministic (§11): tokens, entities dict+regex, intents + confidence 0.35–0.98≠1, 4 guardrails, routing blocked/local/cloud + reason; ≥25 table cases

## M6 — RAG
- `POST /playground/rag-simulation` (§10): 5 stages with perf_counter timings, total_ms, modes live/cached(24h Redis)/fallback(lexical websearch_to_tsquery+ts_rank_cd + extractive, stages honest ~0/skipped), never 503 on provider fail (only ai_unavailable if DB fails), daily budget, query 3–300 sanitize, strict system prompt only-chunks ≤3 sentences ≤600 chars plain-text, 8s timeout 1-retry, Fake/OpenAI embeddings + Mock/Anthropic LLM factory
- Safety + injection regression tests

## M7 — Hardening
- Rate limits per A.2 (Redis sliding-window, Retry-After + X-RateLimit-*, trust XFF by hops, fail-open GET / fail-closed POST + loud log)
- Headers (nosniff, no-referrer, DENY, same-site, HSTS prod), CORS allowlist (GET/POST/PATCH/OPTIONS, no creds), 64KB body limit →413, IP sha256(salt), PII never in logs, bound params only, admin compare_digest + rate-limit fails, uv.lock + audit, `make purge-lead`

## M8 — Delivery
- Coverage ≥85% overall, ≥95% pricing/lead_scoring/prompt_parser; contract tests (OpenAPI field/enum match + golden via HTTP); committed `docs/openapi.json`; README curl per endpoint; `docs/HANDOFF.md`; launch gates + prod startup warnings; final walkthrough (milestones, tests/coverage, deviations, 3 cmds)

## Cross-cutting
- Typed (mypy strict), ruff, async E2E no blocking in handlers, no secrets in code/logs, extra=forbid, ints strict, unified envelope.
