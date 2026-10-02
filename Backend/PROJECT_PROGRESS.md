# Project Progress — Tech Agency Platform API

Single file tracking **what was built, how it works, and what remains**. Detailed per-milestone log lives in `docs/PROGRESS.md`; plan in `docs/PLAN.md`; handoff in `docs/HANDOFF.md`; deviations in `docs/DEVIATIONS.md`.

Last updated: 2026-10-02. Status: **M0–M7 DONE, M8 PARTIAL**. Tests: **22 passed**. Coverage: **63% overall** (target 85%).

---

## 1. What this project is

Backend for a high-end software + IT-infrastructure agency website. Powers content, project scope estimator, AI Lab RAG demo + prompt visualizer, command-palette search, lead capture + notifications + minimal admin.

- Stack: Python 3.12 + FastAPI, SQLAlchemy 2.0 async + asyncpg + Alembic, pgvector `VECTOR(1536)` HNSW, Redis + ARQ, uv, Pydantic v2, structlog, pytest.
- Contract: `backend_engineering_prompt_aiweb.md` Appendix A is law. Base path `/api/v1`, `snake_case`, integer money/weeks, envelopes `{success:true,...}` / `{success:false,error:{code,message,details}}`, `X-Request-ID` on every response.
- Generated spec: `docs/openapi.json` (17 paths).

## 2. Repository map

```
Backend/
├── PROJECT_PROGRESS.md        # this file
├── backend_engineering_prompt_aiweb.md  # source spec
├── pyproject.toml / uv.lock   # deps + ruff/mypy/pytest config
├── Dockerfile                 # multi-stage, non-root, healthcheck
├── docker-compose.yml         # api, worker, postgres (pgvector/pgvector:pg16), redis
├── Makefile                   # dev/test/lint/typecheck/migrate/seed/openapi/purge-lead
├── .env.example / alembic.ini / README.md
├── docs/PLAN.md PROGRESS.md DEVIATIONS.md HANDOFF.md openapi.json
├── app/
│   ├── main.py                # factory, lifespan, middleware, exception handlers
│   ├── config.py              # pydantic-settings, prod refuse-to-start
│   ├── core/db.py redis.py logging.py errors.py security.py rate_limit.py request_id.py
│   ├── models/tables.py       # services, case_studies, lead_estimates, hardware_blueprints, ai_lab_knowledge_base, contact_submissions
│   ├── schemas/common.py requests.py  # mirrors Appendix A
│   ├── api/v1/router.py + health.py services.py case_studies.py blueprints.py estimate.py search.py playground.py webhooks.py admin.py
│   ├── services/pricing/engine.py + pricing.v1.json
│   ├── services/lead_scoring.py prompt_parser.py search.py notifications.py
│   ├── services/rag/embeddings.py llm.py retriever.py pipeline.py prompts.py
│   ├── workers/main.py        # ARQ jobs
│   └── seed/seed.py purge.py + data/*.json
├── migrations/versions/0001_core.py 0002_additions.py
└── tests/unit/ integration/ contract/
```

## 3. How it works

### 3.1 Request lifecycle (`app/main.py`)

1. `rate_limit_middleware` (`app/core/rate_limit.py`): Redis sliding-window per IP per prefix. Limits per Appendix A.2. Adds `X-RateLimit-Limit/Remaining`, `Retry-After` on 429. Prod: fail-open GET / fail-closed POST + loud log when Redis down; dev/test: in-memory fallback same limits.
2. `RequestIDMiddleware` (`app/core/request_id.py`): echoes `X-Request-ID` or generates UUID.
3. `SecurityHeadersMiddleware` + HSTS (prod), `AccessLogMiddleware` (one structlog line, no PII), `BodyLimitMiddleware` (64KB → `413 payload_too_large`), CORS allowlist from `CORS_ORIGINS` (`app/config.py`).
4. `install_exception_handlers` (`app/core/errors.py`): `RequestValidationError` → `422 validation_error`, `HTTPException` → mapped code, unhandled → `500 internal_error` (no trace leak, logs `request_id`).
5. Router (`app/api/v1/router.py`) dispatches to resource modules. All request models use `extra="forbid"`, strict ints.

### 3.2 Content (`app/api/v1/services.py`, `case_studies.py`, `blueprints.py`)

- Ordered `sort_order ASC, created_at DESC`. Unknown `filter`/`category` → 422, unknown slug/code → 404.
- `metrics` JSONB → `MetricItem[]` in insertion order; `label` = humanized key (`latency_reduction` → `Latency reduction`); `headline_metrics` = first two.
- `Cache-Control: public, max-age=60, stale-while-revalidate=300` + weak `ETag`; `If-None-Match` → 304. Estimator/playground/search send `no-store`.
- `/health` always 200 if process up; `/health/ready` (`app/api/v1/health.py`) checks DB + Redis, 503 `degraded` if either down.

### 3.3 Estimator (`app/services/pricing/engine.py`, `pricing.v1.json`)

Pure functions, no I/O. `version` stored on every lead.

1. Software line if any of `custom_web|erp_custom|ai_solutions`: service costs + `roles × per_user_role` + `integrations × per_integration`.
2. Hardware line: `office_networking` base + `workstations × per_workstation` + `ceil(sqft/100) × per_100_sqft`; `+server_rack` if `require_server_rack` and (`office_networking` or `local_ai_server`); `+workstations × provisioning` if selected.
3. On-prem AI: `+local_ai_server` if selected; `+air_gap_hardening` if `local_ai_server` + `air_gapped_security`.
4. Rounding: each line min/max rounded to nearest `rounding` (50, half-up) **before** summing so breakdown sums to total.
5. Timeline: `max(software_weeks, hardware_weeks) + buffer` per bound; buffer only if software selected.
6. Breakdown includes key only if `max > 0`. `ai_deployment_type`, `recommended_blueprint` (10/25 seat switches), `assumptions` per §8.2. Validation returns 422 field details.

Golden A.4 reproduces exactly: `18500–27000`, `6–10`, `12000–16000 / 4000–6000 / 2500–5000`, `BLUEPRINT-AIRGAP-25`, `on_premise_airgapped`.

Lead scoring (`app/services/lead_scoring.py`, 0–100 capped): +20 if max≥25000 (else +10 if ≥10000), +15 if ≥3 services, +15 company, +10 phone, +15 erp/airgap, +10 ws≥25, +5 notes≥40 chars.

### 3.4 Leads (`app/api/v1/estimate.py`, `app/workers/main.py`, `app/services/notifications.py`)

- `POST /estimate/submit`: honeypot `website` → fake 200 + `honeypot_hit` log; server-side recalc (never trusts client numbers); dedupe same lower-email + canonical-JSON hash within 10 min → return existing; stores `consent_at`, `ip_hash=sha256(ip+salt)`, `timeline max/min`, `input/result`, `score`, `pricing_version`; enqueues ARQ jobs best-effort (Redis down still 200).
- `POST /contact` same honeypot/consent/hash/enqueue → `contact_submissions`.
- `POST /webhooks/cal` (`app/api/v1/webhooks.py`): HMAC-SHA256 raw body vs `CAL_WEBHOOK_SECRET` constant-time; empty secret → 404; sets most-recent lead by email to `discovery_booked` + `booked_at`; idempotent; unknown email 200; bad sig 401.
- `GET /admin/leads` + `PATCH /admin/leads/{id}` (`app/api/v1/admin.py`): `X-Admin-Key` `compare_digest`, 401 generic.
- Workers: `notify_new_lead`, `notify_new_contact`, `send_lead_confirmation` — idempotent Redis guard, 3× backoff, SMTP via `aiosmtplib` else log, Slack webhook, Jinja2 autoescape, no ids/scores to visitor.

### 3.5 Search (`app/api/v1/search.py`, `app/services/search.py`)

- Static `PAGES` (Home `/`, Services, 4 service pages, `/work`, `/ai-lab`, `/estimator`, `/about`, `/contact`) + `ACTIONS` (Calculate scope → `/estimator`, Book call → `/contact#book`) with keywords.
- DB: `ILIKE` on title/summary + trigram index; ranking exact > prefix > FTS > alias; max 3/type; hrefs `/services/{slug}`, `/work/{slug}`. `q<2` → 422.

### 3.6 Prompt parser (`app/services/prompt_parser.py`, `POST /playground/prompt-parse`)

Rule-based, no LLM. Tokens via punctuation split (`word|number|symbol|keyword|entity`); entities dict+regex (`hardware|network|software|compliance|quantity`); intents by keyword score (`network_design|ai_deployment|software_build|compliance_question|general_question`, confidence 0.35–0.98 never 1); 4 guardrails (`contains_sensitive_data|prompt_injection_patterns|length_within_limit|topic_in_scope`); routing `blocked` (sensitive/injection) > `local_air_gapped_model` (compliance/private/air-gap) > `cloud_model` + one-sentence reason.

### 3.7 RAG (`POST /playground/rag-simulation`, `app/services/rag/*`)

Stages in order with `perf_counter` timings: `embed_query` → `vector_search` (pgvector cosine `1-(embedding<=>:q)`, clamped) → `rerank` (+0.1 if ≥2 keyword overlap, deterministic) → `prompt_assembly` (system prompt in `prompts.py`) → `generation`. `total_ms` wall time.

Modes: `live` (openai+anthropic+budget), `cached` (same normalized query+top_k 24h Redis), `fallback` (lexical `websearch_to_tsquery`+`ts_rank_cd` + extractive 1–2 sentences, embed/prompt stages `~0` honest `Skipped (demo mode)`). Provider fail → degrade, never 503; `ai_unavailable` only if DB fails. Query 3–300 sanitized; LLM sees only chunks, ≤3 sentences, plain text ≤600 chars, 8s timeout 1 retry. Providers: `FakeEmbedding` (hash unit vectors, dev) / `OpenAI` (1536d) / `MockLLM` (extractive) / `Anthropic` (`LLM_MODEL` from env).

Seed chunk required by spec exists: `All AI inference requests are isolated to VLAN 30 with strict outbound port blocking.` (`Network_Security_Spec.pdf`).

### 3.8 Hardening + observability

Rate limits (A.2), headers, CORS, 64KB limit, IP hashing, no PII in logs (`lead_id`/`request_id` only), bound params, `uv.lock` + audit in CI, `make purge-lead EMAIL=...` GDPR erasure (`app/seed/purge.py`). structlog JSON prod / pretty dev, one access line per request, redact auth/cookies; optional Sentry; `/health/ready` includes `version`.

## 4. Phase-wise progress

| Milestone | State | Evidence |
|---|---|---|
| M0 Scaffold | DONE | `docker compose config` OK; `/health` 200; `ruff` clean |
| M1 Database | DONE | `alembic upgrade head` + `downgrade -1` clean; seed run1 `4/6/4/22`, run2 `0/0/0/0` |
| M2 Content | DONE | curl 4 services, 6 studies, AIRGAP zones 6; 422/404/304 verified |
| M3 Estimator | DONE | golden via HTTP exact; `test_pricing.py` (golden, pairs, 200 seeded rounding, monotonicity, 10/11 25/26 switches) pass |
| M4 Leads | DONE | `test_submit_dedupe_honeypot`, `test_contact_and_honeypot`, `test_webhook_and_admin` pass on real PG+Redis |
| M5 Search+Parser | DONE | `q=erp` mix; 26 parser cases pass; ~4–6ms |
| M6 RAG | DONE | fallback chunk verified; 5 stages; 2nd call `cached` |
| M7 Hardening | DONE | headers + `X-RateLimit-*` verified; prod fail-closed reviewed |
| M8 Delivery | PARTIAL | 22 passed; `openapi.json` 17 paths committed; README/HANDOFF done; coverage 63% (need 85%), pricing 94% (need 95%), mypy 89 errors pending |

Tests present: `tests/unit/test_pricing.py`, `test_lead_scoring.py`, `test_prompt_parser.py` (26 cases), `test_health_config.py`, `tests/contract/test_contract.py` (paths + golden), `tests/integration/test_api.py` (10 async tests on real DB/Redis).

## 5. Run / test / operate

```bash
cp .env.example .env
docker compose up --build
curl http://localhost:8000/health
```

- `make migrate | seed | openapi | test | lint | typecheck | worker`
- `make purge-lead EMAIL=someone@example.com`
- Docs: `http://localhost:8000/docs`; spec `docs/openapi.json`; frontend types: `npx openapi-typescript docs/openapi.json -o src/api/types.ts`
- Live AI: `EMBEDDING_PROVIDER=openai` + `OPENAI_API_KEY`, `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` + `LLM_MODEL`; reseed to re-embed.

Key envs: `ENVIRONMENT`, `DATABASE_URL`, `REDIS_URL`, `CORS_ORIGINS`, `ADMIN_API_KEY` (≥32), `IP_HASH_SALT`, `PUBLIC_BOOKING_URL`, `CAL_WEBHOOK_SECRET` (empty→404), `EMBEDDING_PROVIDER`, `LLM_PROVIDER`, `RAG_DAILY_BUDGET`, `SMTP_URL` (empty→log), `NOTIFY_EMAIL_TO`, `SLACK_WEBHOOK_URL`, `SENTRY_DSN`, `PRICING_FILE`, `TRUSTED_PROXY_HOPS`, `GIT_SHA`.

Launch gates: replace `is_placeholder` studies; set real secrets/SMTP/Slack; prod CORS only; review `pricing.v1.json` + bump `version`; configure AI keys or keep `fallback`.

## 6. Remaining + deviations

Remaining (M8): raise coverage to ≥85% / pricing ≥95% (add notifications/RAG/worker tests); `mypy --strict` cleanup (89 errors, mostly `Any` generics); final `openapi.json` diff + browser `/docs` check.

Deviations (contract unchanged, see `docs/DEVIATIONS.md`): ARQ `aclose()`; in-memory rate-limit fallback for dev/test (prod strict); one parser test disambiguated; Dockerfile `uv sync --frozen` fix.
