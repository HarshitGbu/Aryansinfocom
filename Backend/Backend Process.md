# Backend Process — Aryan Infocom Website

How the backend works and what features are added.

## 1. Overview

- Stack: Python 3.12 + FastAPI, PostgreSQL + pgvector, Redis, ARQ worker, SQLAlchemy async, Alembic, Pydantic v2, Docker Compose.
- Base URL: `http://localhost:8000`, API base: `/api/v1`.
- Contract: JSON, `snake_case`, integer money (USD) and weeks, envelopes `{success:true,...}` and `{success:false,error:{code,message,details}}`, `X-Request-ID` on every response.
- Services: `api`, `worker`, `postgres` (`pgvector/pgvector:pg16`), `redis`.

## 2. Request flow

1. Rate-limit check (Redis sliding window, per IP).
2. Request-ID assigned/echoed.
3. Security headers, CORS, 64KB body limit, access log.
4. Validation (`extra="forbid"`, strict ints).
5. Handler → DB/Redis → response with `Cache-Control` / `ETag` / `X-RateLimit-*`.

Main factory: `app/main.py`. Config: `app/config.py`. Core: `app/core/db.py`, `redis.py`, `errors.py`, `security.py`, `rate_limit.py`, `request_id.py`.

## 3. Features added

### 3.1 Health

- `GET /health` — liveness, always 200 if process up.
- `GET /health/ready` — checks Postgres + Redis, returns `ready` or `degraded` (503).
- Code: `app/api/v1/health.py`.

### 3.2 Content APIs (cacheable)

- `GET /services` + `GET /services/{slug}` — 4 services: web-apps, erp-systems, ai-solutions, infrastructure.
- `GET /case-studies` + `GET /case-studies/{slug}` — 6 illustrative studies, filter `all|web|erp|ai|hardware|hybrid`, `limit|offset`.
- `GET /hardware-blueprints` + `GET /hardware-blueprints/{code}` — 4 tiers, incl. `BLUEPRINT-AIRGAP-25` with 6 zones / 7 links.
- Behavior: ordered by `sort_order`, metrics humanized (`latency_reduction` → `Latency reduction`), `headline_metrics` = first 2, `Cache-Control: public, max-age=60, stale-while-revalidate=300` + weak `ETag` + `304`.
- Code: `app/api/v1/services.py`, `case_studies.py`, `blueprints.py`. Models: `app/models/tables.py`. Seed: `app/seed/data/*.json`, `app/seed/seed.py` (idempotent).

### 3.3 Project Scope Estimator

- `POST /estimate/calculate` — stateless price + timeline, nothing stored. Rate limit 30/min.
- Deterministic engine: `app/services/pricing/engine.py` + `app/services/pricing/pricing.v1.json`.
- How it works:
  - Software line (custom_web, erp_custom, ai_solutions + roles + integrations).
  - Hardware line (office_networking base + per-workstation + per-100-sqft + server rack + provisioning).
  - On-prem AI line (local server + air-gap hardening).
  - Each line rounded to nearest 50 before summing.
  - Timeline = `max(software, hardware) + buffer`.
  - Outputs `cost_range_usd`, `timeline_weeks`, `breakdown`, `recommended_blueprint` (10/25-seat switches), `ai_deployment_type`, `assumptions`, `pricing_version`.
- Golden example reproduces exactly: `18500–27000`, `6–10`, `BLUEPRINT-AIRGAP-25`.

### 3.4 Lead capture

- `POST /estimate/submit` — recalculates server-side, honeypot `website` field (bots get fake 200, nothing stored), dedupes same email + same input within 10 min, stores lead with `consent_at`, `ip_hash`, `lead_score` (0–100), `pricing_version`, enqueues notification jobs. Rate limit 5/10min.
- `POST /contact` — same honeypot/consent/hash pattern into `contact_submissions`.
- `POST /webhooks/cal` — Cal.com booking webhook, HMAC-SHA256 verified, marks latest lead `discovery_booked`.
- `GET /admin/leads`, `PATCH /admin/leads/{id}` — `X-Admin-Key` auth, filter/status support.
- Background jobs (ARQ): staff email + Slack + visitor confirmation. Code: `app/api/v1/estimate.py`, `webhooks.py`, `admin.py`, `app/workers/main.py`, `app/services/notifications.py`, `lead_scoring.py`.

### 3.5 AI Lab — Prompt Parser

- `POST /playground/prompt-parse` — rule-based, no LLM. Rate limit 20/min.
- How it works: tokenizes input, detects entities (hardware/network/software/compliance/quantity), scores intent (`network_design|ai_deployment|software_build|compliance_question|general_question`), runs 4 guardrails (sensitive data, injection, length, scope), routes to `blocked|local_air_gapped_model|cloud_model` with reason.
- Code: `app/services/prompt_parser.py`, `app/api/v1/playground.py`.

### 3.6 AI Lab — RAG Simulation

- `POST /playground/rag-simulation` — demo retrieval over 22 seeded chunks. Rate limit 10/min.
- How it works, 5 timed stages: `embed_query` → `vector_search` (pgvector cosine) → `rerank` → `prompt_assembly` → `generation`.
- Modes: `live` (OpenAI + Anthropic), `cached` (same query 24h Redis), `fallback` (lexical Postgres FTS + extractive answer, no LLM). Never 503 on provider failure; `ai_unavailable` only if DB fails.
- Safety: query 3–300 chars sanitized, LLM sees only chunks, ≤3 sentences, plain text ≤600 chars.
- Code: `app/services/rag/embeddings.py`, `llm.py`, `retriever.py`, `pipeline.py`, `prompts.py`.

### 3.7 Command-palette Search

- `GET /search?q=&limit=` — mixes `service|case_study|page|action`. Rate limit 60/min.
- How it works: static pages/actions registry + Postgres `ILIKE`/FTS on services/case studies, ranked exact > prefix > FTS > alias, max 3 per type. `q<2` → 422.
- Code: `app/api/v1/search.py`, `app/services/search.py`.

### 3.8 Security and hardening

- Redis sliding-window limits with `Retry-After`, `X-RateLimit-*`; prod fail-open reads / fail-closed writes.
- Headers: `nosniff`, `no-referrer`, `DENY`, `same-site`, HSTS in prod. CORS allowlist, no credentials.
- 64KB body → `413`, strict validation, `X-Forwarded-For` trusted hops, IPs stored as `sha256(ip+salt)`, no PII in logs, bound SQL params, admin key constant-time compare, `uv.lock` + audit, `make purge-lead EMAIL=...`.
- Code: `app/core/rate_limit.py`, `request_id.py`, `security.py`, `errors.py`.

## 4. Data and migrations

- Tables: `services`, `case_studies`, `lead_estimates`, `hardware_blueprints`, `ai_lab_knowledge_base` (`VECTOR(1536)` + `tsv` + HNSW), `contact_submissions`.
- Migrations: `migrations/versions/0001_core.py`, `0002_additions.py` (extensions `uuid-ossp`, `vector`, `pg_trgm`).
- Seed: `make seed` (upserts, twice = no change). `make migrate`, `make purge-lead`, `make openapi`.

## 5. Run

```bash
cp .env.example .env
docker compose up --build
curl http://localhost:8000/health
```

Docs: `http://localhost:8000/docs`, spec: `docs/openapi.json`. Progress: `PROJECT_PROGRESS.md`, `docs/PROGRESS.md`.
