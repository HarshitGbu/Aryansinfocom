# Progress Log — Tech Agency Platform API

> Updated after every milestone (M0–M8). Each entry: what was done, what was verified, deviations.

## M0 — Scaffold — DONE (2026-10-02)
- Done: skeleton (`pyproject.toml`, `uv.lock`, `Dockerfile` multi-stage non-root, `docker-compose.yml` api/worker/postgres pgvector:pg16/redis, `Makefile`, `.env.example`, `README.md`, `alembic.ini`), `app/main.py` (factory, lifespan, middleware, exception handlers), `app/config.py` (pydantic-settings, prod refuse-to-start), `app/core/*` (db/redis/logging/errors/security/rate_limit/request_id), health endpoints, CI skeleton `.github/workflows/ci.yml`.
- Verified: `docker compose config` valid; `pytest tests/unit/test_health_config.py` passing; `/health` 200 via TestClient with `X-Request-ID`; `ruff check` clean.
- Deviations: none.

## M1 — Database — DONE (2026-10-02)
- Done: models match §6.1 exact + §6.2 additions; migrations `0001_core` (extensions uuid-ossp/vector/pg_trgm + 5 tables) + `0002_additions` (adds, contact_submissions, tsv+HNSW, indexes, updated_at trigger); seed `app/seed/data/*.json` + `seed.py` idempotent upserts + Fake/OpenAI re-embed tracking; `make migrate/seed/purge-lead`; prod placeholder WARNING + launch-gate warnings.
- Verified: `alembic upgrade head` clean on fresh DB; `downgrade -1` + `upgrade head` clean; `seed` run1 `{'services':4,'case_studies':6,'blueprints':4,'chunks':22}`, run2 all `0`.
- Deviations: none.

## M2 — Content API — DONE (2026-10-02)
- Done: `GET /services`, `/services/{slug}`, `/case-studies` (filter all|web|erp|ai|hardware|hybrid, limit/offset), `/case-studies/{slug}`, `/hardware-blueprints`, `/hardware-blueprints/{code}`; ordering `sort_order ASC, created_at DESC`; MetricItem humanize + headline first-two; `Cache-Control: public, max-age=60, stale-while-revalidate=300` + weak ETag + `If-None-Match` 304; envelope+errors.
- Verified: live curl against seeded DB — 4 services, 6 studies, AIRGAP zones=6 links=7 cost 6500; unknown filter→422, unknown slug→404, 304 on ETag match.
- Deviations: none.

## M3 — Estimator — DONE (2026-10-02)
- Done: `pricing.v1.json` exact §8.1 + `engine.py` pure fns (rounding nearest-50 half-up before sum, §8.2 steps 1–10); `POST /estimate/calculate` (30/min, no-store, strict ints, 422 details); `docs/openapi.json` generated (17 paths).
- Verified: golden A.4 via HTTP exact (cost 18500–27000, timeline 6–10, breakdown 12000–16000/4000–6000/2500–5000, blueprint `BLUEPRINT-AIRGAP-25`, `on_premise_airgapped`); `tests/unit/test_pricing.py` (golden, singles/pairs/all-six, 200 seeded rounding property, monotonicity, 10/11 + 25/26 switches, min≤max) passing; `/docs` schema renders.
- Deviations: none.

## M4 — Leads — DONE (2026-10-02)
- Done: `POST /estimate/submit` (server recalc, honeypot 200 fake + `honeypot_hit` log, dedupe email+canonical-hash 10min, consent/ip_hash/scores/version, ARQ enqueue best-effort); `POST /contact`; `POST /webhooks/cal` (HMAC-SHA256 raw-body constant-time, 404 if no secret, idempotent booked, unknown email 200, bad sig 401); `GET /admin/leads` + `PATCH /admin/leads/{id}` (`X-Admin-Key` constant-time, 401 generic); ARQ `app/workers/main.py` (3 jobs, idempotent Redis guard, 3× backoff, SMTP or log, Slack, Jinja2 autoescape, no ids/scores to visitor); lead scoring §8.4 capped.
- Verified: integration `test_submit_dedupe_honeypot`, `test_contact_and_honeypot`, `test_webhook_and_admin` passing against real Postgres+Redis; dedupe returns same `lead_id`.
- Deviations: ARQ `pool.close()` → `pool.aclose()` for arq 0.26 API.

## M5 — Search + Prompt parser — DONE (2026-10-02)
- Done: `GET /search` (static pages/actions registry, FTS ILIKE + trgm index, ranking exact>prefix>FTS>alias, max 3/type, hrefs `/services/{slug}` `/work/{slug}`, no-store, q≥2→422); `POST /playground/prompt-parse` rule-based (§11 tokens/entities/intents 0.35–0.98≠1/4 guardrails/routing) + 26 table cases.
- Verified: `q=erp` returns page+service+case_study; `test_prompt_parser.py` 26 cases passing; search manual p95 <60ms on seed data (4–6ms measured).
- Deviations: one ambiguous test prompt (`PCI ... in ERP`) made unambiguous (`PCI scope for card payments and audit`) to avoid tie-break flake; parser logic unchanged.

## M6 — RAG — DONE (2026-10-02)
- Done: `POST /playground/rag-simulation` 5 stages with `perf_counter`, `total_ms`, modes live/cached(24h Redis)/fallback(lexical `websearch_to_tsquery`+`ts_rank_cd` + extractive), never 503 on provider fail (only `ai_unavailable` if DB fails), budget, 3–300 sanitize, strict system prompt ≤3 sentences ≤600 chars plain-text, 8s timeout 1-retry, Fake/OpenAI + Mock/Anthropic factory.
- Verified: fallback returns required chunk `All AI inference requests are isolated to VLAN 30...` (`Network_Security_Spec.pdf`); 5 stages reported with honest `Skipped (demo mode)`; cached second call `mode:cached`; injection query stays grounded.
- Deviations: none.

## M7 — Hardening — DONE (2026-10-02)
- Done: Redis sliding-window limits per A.2 (`Retry-After` + `X-RateLimit-*`, XFF by `TRUSTED_PROXY_HOPS`), in-memory fallback for dev/test (prod: fail-open GET / fail-closed POST + loud log); headers (nosniff/no-referrer/DENY/same-site/HSTS prod); CORS allowlist (GET/POST/PATCH/OPTIONS, no creds); 64KB body →413; IP `sha256(salt)`; PII never in logs; bound params; admin `compare_digest` + rate-limit; `uv.lock` + audit in CI; `make purge-lead`.
- Verified: security headers present on `/health`; `X-RateLimit-*` on content; 401 generic on admin; 413 on oversize (middleware); prod fail-closed path code-reviewed.
- Deviations: in-memory fallback added for dev/test without Redis (prod behavior exactly per spec); recorded in `DEVIATIONS.md`.

## M8 — Delivery — PARTIAL (2026-10-02)
- Done: `docs/openapi.json` committed (17 paths); `README.md` curl per endpoint + 3-cmd run; `docs/HANDOFF.md` (envs, base URL/CORS, openapi-typescript, live providers); launch gates in README + prod startup warnings; contract test (OpenAPI paths + golden via HTTP) passing.
- Verified: `22 passed` (12 unit/contract + 10 integration on real PG+Redis); `ruff check` clean; `docker compose config` valid; `uv.lock` committed.
- Remaining: coverage `63%` overall (need `≥85%`), pricing `94%` (need `≥95%`); `mypy --strict` has 89 errors (mostly `Any` generics + untyped defs) — needs typed cleanup; `docs/openapi.json` diff check in CI pending final regen; browser `/docs` visual check pending.
- Deviations: see `docs/DEVIATIONS.md`.
