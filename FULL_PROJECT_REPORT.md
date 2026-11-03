# Full Project Report — Tech Agency Platform (Website + API)
**Project Manager report | Date: 2026-10-02 | Repo: `/home/harshit/Aryan Infocom website` (git, 1 commit `2378ae2`, 240 files tracked, tree clean)**

## 1. Executive summary
A high-end software + IT-infrastructure agency website (Next.js frontend) backed by a FastAPI platform API (content, scope estimator, AI Lab RAG + prompt parser, command-palette search, lead capture, minimal admin).

- **Backend:** functionally complete (M0–M7 DONE, M8 PARTIAL). 17 API paths live, A.4 golden estimate reproduces exactly, 22 tests passed. Gaps are delivery-grade only: coverage 63% (target 85%), `mypy --strict` 89 errors, placeholder case studies, example secrets.
- **Frontend:** all 8 build phases done; only manual verification items remain (Lighthouse score, keyboard walkthrough, reduced-motion check, Playwright smoke). `typecheck` 0, `lint` 0, `test` 5/5, `build` 12/12 routes.
- **Integration:** verified live end-to-end on 2026-10-02. One contract bug found and fixed (`search()` sent POST, API is GET-only). Stack runs at `http://localhost:3000` → `http://localhost:8000/api/v1`.

## 2. Repository map
```
. (git: 1 commit, clean)
├── Backend/            # FastAPI + Postgres(pgvector) + Redis + ARQ, uv
│   ├── app/            # main, config, core/, models/, schemas/, api/v1/, services/ (pricing, rag…), workers/, seed/
│   ├── migrations/     # Alembic (0001_core, 0002_additions)
│   ├── tests/          # unit(4) + integration(1) + contract(1) — 22 tests passed
│   ├── docs/           # PLAN, PROGRESS, DEVIATIONS, HANDOFF, openapi.json (17 paths)
│   ├── Dockerfile, docker-compose.yml (api, worker, postgres pg16-pgvector, redis), Makefile, .env.example
│   ├── PROJECT_PROGRESS.md, README.md, backend_engineering_prompt_aiweb.md
│   └── .venv/ (local, gitignored) — used to run the API on this host
├── frontend/           # Next.js 16.3.8 + Tailwind v4, pnpm
│   ├── src/app/        # /, services, services/[slug], work, work/[slug], ai-lab, estimator, about, contact
│   ├── src/components/ # shell, ui, home, services, work, estimator, ai-lab, contact
│   ├── src/lib/        # api (client, endpoints, types, mocks), stores, hooks, format, validation
│   ├── src/content/    # site, copy, metrics, tech-stack, pillars, process, team (PLACEHOLDER-marked)
│   ├── src/tests/      # vitest (5 tests)
│   ├── PROGRESS.md, BACKEND_HANDOFF_FOR_FRONTEND.md, frontend_engineering_prompt_aiweb.md, README.md
│   └── .env.local (gitignored, mocking disabled) — server + browser both point at :8000
└── FULL_PROJECT_REPORT.md (this file)
```

## 3. Backend report
- **Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0 async + asyncpg + Alembic, pgvector `VECTOR(1536)` HNSW, Redis + ARQ, Pydantic v2 strict, structlog, pytest. Managed with `uv` (lockfile committed).
- **Milestones:** M0 Scaffold – M7 Hardening DONE; M8 Delivery PARTIAL (spec committed, README/HANDOFF done; coverage + typecheck remain).
- **Endpoints (all under `/api/v1`, envelopes `{success:true,…}` / `{success:false,error:{code,message,details}}`, `X-Request-ID` always):**

| Method | Path | Rate limit | Notes |
|---|---|---|---|
| GET | `/health`, `/health/ready` | none | readiness 503 `degraded` if DB/Redis down |
| GET | `/services`, `/services/{slug}` | 120/min | `?category?`; ETag/304; `revalidate 60` |
| GET | `/case-studies`, `/case-studies/{slug}` | 120/min | `filter=all,web,erp,ai,hardware,hybrid`; limit 12/max 50 |
| GET | `/hardware-blueprints`, `/hardware-blueprints/{code}` | 120/min | `BLUEPRINT-AIRGAP-25`: 6 zones (wan/fw/office:10/servers:20/ai:30/mgmt:99), 7 links |
| POST | `/estimate/calculate` | 30/min | stateless; **golden exact**: 18500–27000, 6–10 wks, breakdown 12000–16000/4000–6000/2500–5000, AIRGAP-25, `on_premise_airgapped`, `pricing_version 2026-10-v1` |
| POST | `/estimate/submit` | 5/10min | server recalc, honeypot `website`, 10-min dedupe, `booking_url` nullable |
| POST | `/contact` | 5/10min | same honeypot/consent pattern → `contact_submissions` |
| POST | `/playground/rag-simulation` | 10/min + 100/day | 5 stages; modes live/cached/**fallback** (default here: lexical + extractive) |
| POST | `/playground/prompt-parse` | 20/min | deterministic rule-based; 4 guardrails; routing blocked > local > cloud |
| GET | `/search` | 60/min | `q` min 2 chars; pages+actions static, services/studies via FTS/`ILIKE` |
| POST | `/webhooks/cal` | none | HMAC-SHA256; backend-only |
| GET/PATCH | `/admin/leads…` | 60/min | `X-Admin-Key`; backend-only — never called from browser |
- **Behaviors verified:** strict ints + `extra="forbid"` (unknown fields rejected), money/weeks integers, rounding (lines rounded to 50 before summing), lead scoring 0–100, IP hashing, 64KB body cap → 413, security headers, Redis sliding-window limits with `Retry-After`, fail-open GET / fail-closed POST when Redis down, `make purge-lead EMAIL=` GDPR erasure (exercised: deleted 1 lead + 1 contact).
- **Seed:** 4 services, 6 case studies (all `is_placeholder=true` — must be replaced before launch), 4 blueprints, 20–30 RAG chunks incl. required VLAN-30 sentence. Idempotent (re-run changes nothing).
- **Known gaps (do not block frontend):** coverage 63% vs 85% target (pricing 94% vs 95%); 89 `mypy --strict` errors; prod secrets/CORS/pricing review pending (launch gates in README); AI runs `fallback` demo mode until provider keys set.

## 4. Frontend report
- **Stack:** Next.js 16.3.8 App Router, Tailwind v4 (tokens exact per spec), shadcn-style Radix primitives, cmdk palette, framer-motion + GSAP (Synergy only), Lenis, zustand + TanStack Query, react-hook-form + zod, react-markdown, Cal embed (lazy), lucide, Geist + JetBrains Mono, vitest + Playwright.
- **Design:** dark-only (`#050507` void), Linear hairlines + Raycast ⌘K/spotlight + Liquid Glass (floating surfaces only, ≤3/viewport). Motion on a strict budget; reduced-motion/transparency respected.
- **Pages (all 200, verified):** Home (hero sequence, metric ribbon, 5-pillar bento, GSAP synergy stack, tech switcher, featured work ×3, estimator teaser, footer CTA) · `/services` + `/services/[slug]` (TOC scroll-spy, Markdown, related work) · `/work` + `/work/[slug]` (URL-synced filters, expanding cards) · `/estimator` (6-step wizard, conditional office/software steps, debounced live summary, sessionStorage persist) · `/ai-lab` (RAG simulator with scaled pipeline animation + mode badge, prompt parser, air-gap diagram) · `/about` · `/contact` (Cal embed/fallback, validated form + honeypot).
- **Data layer:** typed `request<T>()` (10s timeout, `ApiError{status,code,details,retryAfterSeconds}`), one function per endpoint, Appendix-A types verbatim, mocks behind `NEXT_PUBLIC_API_MOCKING` (golden fixture for calculate). Content GETs `revalidate:60`, mutations/search `no-store`.
- **Quality:** `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 5/5, `pnpm build` 12/12 routes (static + dynamic correct, content revalidate 1m).
- **Remaining (manual):** Lighthouse mobile ≥90 on `/`; keyboard-only walkthrough; contrast check on glass; `prefers-reduced-motion/transparency` manual check; Playwright smoke (palette, estimator 1→4, contact validation). Content placeholders tracked in `docs/CONTENT_TODO.md`.

## 5. Integration report (connection)
- **Contract:** Appendix A is byte-identical law in both prompts. Frontend `src/lib/api/types.ts` mirrors it verbatim; `pnpm gen:api` targets `../Backend/docs/openapi.json` (note: committed spec has empty response schemas, so Appendix A — not codegen — is the type source of truth).
- **Environments:** `API_BASE_URL` + `NEXT_PUBLIC_API_BASE_URL` = `http://localhost:8000`; backend `CORS_ORIGINS=http://localhost:3000` (verified header); frontend mocking **disabled**.
- **Fixes applied by PM:** (1) `frontend/src/lib/api/endpoints.ts` `search()` used `POST` → backend answers `405`; changed to `GET` (all other 10 call sites already matched). (2) Backend `.env` was missing — created from `.env.example`. (3) Docker `api/worker` image cannot build on this host (no network for `uv sync` — DNS failure); API runs from `Backend/.venv` instead. Logged in `frontend/PROGRESS.md`.
- **Live verification (2026-10-02, all passed):** readiness `ready` (db+redis true); services list; case-studies filter; AIRGAP-25 zones/links; golden estimate exact; search GET (+ POST correctly 405); prompt-parse intent/routing; RAG 5 stages with `Network_Security_Spec.pdf` chunk; CORS allow-origin; submit→lead + contact→submission + purge cleanup; all 7 frontend pages 200 with live backend titles.

## 6. Run book
```bash
# 1. data services (Docker — works, healthy)
cd Backend && docker compose up -d postgres redis
# 2. migrate + seed (host venv — Docker api build has no network here)
export DATABASE_URL="postgresql+asyncpg://app:app@localhost:5432/agency" REDIS_URL="redis://localhost:6379/0"
.venv/bin/alembic upgrade head && .venv/bin/python -m app.seed.seed
# 3. API (background; logs to /tmp/opencode/run/backend.log)
.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000
curl http://localhost:8000/health/ready
# 4. website (background; logs to /tmp/opencode/run/frontend.log)
cd ../frontend && pnpm dev   # http://localhost:3000 (mocking disabled)
```
Current run-state: postgres/redis healthy; API `ready`; website 200 on all routes. Background processes do not survive host restarts — re-run steps 3–4 if a port is dead.

## 7. Risks and launch gates
1. `is_placeholder` case studies are illustrative — replace with client-approved content before launch (app warns in prod).
2. Set real `ADMIN_API_KEY` (≥32), `IP_HASH_SALT`, `CAL_WEBHOOK_SECRET`, SMTP/Slack, prod-only `CORS_ORIGINS`; review `pricing.v1.json` and bump `version` on change; add AI keys or accept `fallback` demo mode.
3. Backend: raise coverage to 85% (pricing 95%), clear `mypy --strict`, re-run `make openapi` + browser `/docs` check.
4. Frontend: Lighthouse/a11y/reduced-motion/Playwright passes (§4); fill `CONTENT_TODO.md` placeholders (site name, contact, metrics, team, security).
5. Do not build admin UI, CMS, auth, or payments — out of scope. Never call `/admin/*` or `/webhooks/*` from the browser. Never re-implement pricing/RAG/parsing in frontend.
