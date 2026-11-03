# Combined Project Report — Backend + Frontend

Generated: 2026-10-31

---

## PART 1 — Backend

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


---

## PART 2 — Frontend

# Frontend Report — Tech Agency Website

Date: 2026-10-02. Scope: `frontend/` only. Spec: `frontend_engineering_prompt_aiweb.md`
(Appendix A = API contract law). Backend handoff: `BACKEND_HANDOFF_FOR_FRONTEND.md`.
Progress tracker: `PROGRESS.md`. Placeholders: `docs/CONTENT_TODO.md`.

## 1. Status summary

Full site implemented (Phases 0–8). Verified just now:

| Check | Result |
|---|---|
| `pnpm typecheck` (`tsc --noEmit`) | pass, 0 errors |
| `pnpm lint` (`eslint`) | pass, 0 problems |
| `pnpm test` (`vitest run`) | 2 files, 5 tests, all pass |
| `pnpm build` (Turbopack) | pass, 12/12 routes generated |
| Dev server `curl` (earlier) | 200 on all 7 page routes |

Open items (from `PROGRESS.md`, not done): Lighthouse mobile ≥ 90 on `/`,
manual keyboard/screen-reader walkthrough, `prefers-reduced-motion/transparency`
manual check, Playwright smoke spec (package installed, spec not written).

History note: a design-polish pass ("impeccable" subagent) modified 11 files on
2026-10-02 and was fully reverted the same day at the user's request — tree
restored to the spec-built versions. A later PM connection pass fixed one real
contract bug: `search()` sent `POST /search`, backend is GET-only (405) — now
`GET` (`src/lib/api/endpoints.ts:126`). That pass also verified the frontend
against a live backend (golden estimate, blueprint, RAG, search, CORS).

## 2. Stack (all per §6, pnpm)

- Next.js 16.3.8 (App Router, Turbopack), React 19.2.8, TypeScript 5.9.3 (strict, no `any`)
- Tailwind CSS v4 (CSS-first `@theme`), `clsx` + `tailwind-merge` + `cva`
- Radix primitives installed directly (`dialog/tabs/slider/accordion/tooltip/checkbox/slot`);
  shadcn CLI was not run — minimal shadcn-style wrappers written by hand (`ui/`)
- `cmdk` palette, `framer-motion`, `gsap` (ScrollTrigger, Synergy only, dynamic import),
  `lenis` (disabled on touch + reduced motion), `zustand` + `@tanstack/react-query`,
  `react-hook-form` + `zod` + `@hookform/resolvers`, `react-markdown` + `remark-gfm`,
  `@calcom/embed-react` (lazy), `lucide-react`, `geist` (sans) + JetBrains Mono
  (`next/font/google`), `openapi-typescript` (dev), `vitest`, `@playwright/test` (dev)

## 3. Routes (12 build outputs)

| Route | Type | Data |
|---|---|---|
| `/` | static (`revalidate:60` via fetches) | hero, ribbon, bento, synergy, tech, featured work (3), teaser, CTA |
| `/services` | static, 60s | `GET /services` + `pillars.ts` bullets + delivery timeline |
| `/services/[slug]` | dynamic | `GET /services/{slug}`, TOC, Markdown, related work (`web→web, erp→erp, ai→ai, infra→hardware`); unknown slug → `notFound()` |
| `/work` | static (client filter) | `GET /case-studies`, `?filter=` synced via `router.replace(scroll:false)`, `aria-live` count |
| `/work/[slug]` | dynamic | `GET /case-studies/{slug}`, metrics, Markdown, specs; unknown → `notFound()` |
| `/estimator` | static + client wizard | 6-step flow, `?services=` preselect, live summary, submit → done |
| `/ai-lab` | static + lazy tabs | `#rag/#parser/#airgap` hash sync, `ssr:false` simulators |
| `/about` | static | principles, process, security (PLACEHOLDER), team (PLACEHOLDER) |
| `/contact` | static + client form | Cal embed (lazy) or fallback card, validated form, location card |
| `/sitemap.xml`, `/robots.txt` | metadata routes | static paths |
| `/_not-found`, `error.tsx` | boundaries | copy per §11.4, `reset()` retry |

Slugs: services `web-apps/erp-systems/ai-solutions/infrastructure`; work slugs from API.
`loading.tsx` skeletons on `/services`, `/work` (and their detail segments via `error.tsx`).

## 4. Components (71 source files, ~3,800 lines)

- `shell/`: `navbar.tsx` (floating pill, transparent→`liquid-glass` after 24px,
  `layoutId="nav-active"`, mac-aware `⌘K`/`Ctrl K` hint, mobile sheet),
  `footer.tsx` (4 columns, no newsletter), `command-palette.tsx` (§13.2 port:
  Navigate + Actions static groups, debounced 200ms remote `GET /search` for q≥2,
  silent fallback, `↑↓/↵/esc` footer), `palette-lazy.tsx` (client wrapper —
  Next 16 rejects `ssr:false` dynamic in Server layout), `providers.tsx`
  (QueryClient + Lenis), `skip-link.tsx`
- `ui/`: `button.tsx` (primary/glass/ghost), `badge.tsx`, `kbd.tsx`,
  `spotlight-card.tsx` (sets `--mouse-x/y` via `style.setProperty`, focus glow),
  `glass-panel.tsx`, `section.tsx`, `stat.tsx`, `skeleton.tsx`, `markdown.tsx` (GFM, no raw HTML)
- `home/`: `hero.tsx` (§13.1: capsule badge, gradient h1, dual CTAs, `stack.config.ts`
  window + VLAN 30 status card, 6 LEDs, static 64% GPU bar `aria-hidden`, one ~1.6s
  sequence, reduced-motion final state), `metric-ribbon.tsx` (count-up once),
  `capability-bento.tsx` (6-col asymmetric, CSS/SVG visuals), `synergy-stack.tsx`
  (GSAP scrub, desktop pin ≥1024px, clickable layers, static otherwise),
  `tech-switcher.tsx` (tablist filter, monogram tiles), `featured-work.tsx`
  (quiet error card, hides when empty), `estimator-teaser.tsx` (400ms debounce,
  `keepPreviousData`, `?services=` link), `footer-cta.tsx` (single glass card)
- `work/case-card.tsx`: whole-card link, `grid-template-rows 0fr→1fr` expand,
  always-visible on `(hover:none)`, placeholder cover when `cover_image_url` null
- `estimator/`: `wizard.tsx` (6 steps, conditional skip office/software, slide 24px
  transitions, focus to heading, honeypot `tabindex=-1` not `display:none`,
  422/429/other mapping, store cleared on success), `live-summary.tsx`
  (sticky desktop / fixed bottom-bar mobile, disclaimer)
- `ai-lab/`: `lab-tabs.tsx`, `rag-simulator.tsx` (prefill query, top_k 1–5, stages
  scaled 250–700ms ≤3s, score bars, mode badge always visible, 429 uses
  `retry_after_seconds`), `prompt-parser.tsx` (tokens/intent/entities/4 guardrails/
  routing card, 3 presets), `airgap-diagram.tsx` (`BLUEPRINT-AIRGAP-25`, 6 zones /
  7 links, fixed coordinate map, default `ai`, egress badges, policy panel, BOM accordion)
- `contact/`: `contact-form.tsx` (zod, field errors, keeps values on error, success
  `"Message sent. We'll reply within {responseTime}."` + Send another),
  `booking-section.tsx` (empty `CAL_LINK` → fallback card focusing form),
  `booking-embed.tsx`

## 5. Data layer

- `lib/api/types.ts`: Appendix A.3 copied verbatim (contract law; never edited for backend)
- `lib/api/client.ts`: typed `request<T>()`, 10s `AbortController` timeout,
  envelope parse → `ApiError{status,code,message,details,retryAfterSeconds}`
  (429 via `Retry-After` header or `details.retry_after_seconds`);
  server fetches `API_BASE_URL` + `next:{revalidate:60}` (content) / `no-store` (rest);
  browser uses `NEXT_PUBLIC_API_BASE_URL`
- `lib/api/endpoints.ts`: one typed fn per endpoint (services, case studies,
  blueprint, calculate, submit, contact, RAG, parse, search). **GET used for all
  reads including search** (POST→405 lesson, see §1)
- `lib/api/mocks.ts`: fixtures for `NEXT_PUBLIC_API_MOCKING=enabled`
  (4 services, 6 cases, AIRGAP blueprint, A.4 golden for any calculate, canned
  RAG/parser/search). No pricing logic in frontend
- Validation mirrored in zod (`lib/validation.ts` + inline schemas): strict ints,
  1–6 unique services, office 0–500 ws / 0–200000 sqft, roles 0–50, integration slugs
  `^[a-z0-9][a-z0-9_-]{0,39}$` ≤10, names 2–120, message 10–2000, `consent:true`
  literal, honeypot `website`
- Golden A.4: `["custom_web","erp_custom","office_networking","local_ai_server"]` +
  office `{25,3500,true,true}` + software `{4,["stripe","salesforce"]}` →
  `$18,500–$27,000`, `6–10 weeks`, `12000–16000/4000–6000/2500–5000`,
  `BLUEPRINT-AIRGAP-25`, `on_premise_airgapped`, `2026-10-v1` (verified live per PROGRESS)
- `gen:api` script exists but openapi.json has empty response schemas — Appendix A
  remains truth; generated file intentionally not committed

## 6. State, hooks, content, utils

- Stores: `palette-store.ts` (`open/setOpen`); `estimator-store.ts`
  (`step/services/office/software/contact/result/lead`, `needsOffice/needsSoftware`
  helpers, `sessionStorage` key `estimator:v1`, cleared on success)
- Hooks: `use-debounced-value.ts` (200/400ms), `use-count-up.ts` (400ms, reduced-motion aware),
  `use-mouse-glow.ts`
- Content: `site.ts` (name `"Company Name"` + all contact fields PLACEHOLDER),
  `copy.ts` (hero/footer-CtA/errors verbatim §11), `metrics.ts` (4 PLACEHOLDER figures),
  `tech-stack.ts` (21 items, 5 groups), `pillars.ts` (§11.2 copy + capabilities +
  `estimatorServiceMeta`), `process.ts` (delivery + about steps, 5 PLACEHOLDER security items),
  `team.ts` (4 PLACEHOLDER members)
- Utils: `cn.ts`, `format.ts` (`formatUSD/formatRange/formatWeeks/formatRetryAfter`,
  unit-tested), `seo.ts` (`baseMetadata` `%s · {name}` + canonical/OG/Twitter,
  `organizationJsonLd`)
- Tests: `tests/format.test.ts`, `tests/estimator-store.test.ts` (5 tests pass);
  `vitest.config.ts` aliases `@→src`

## 7. Design system (exact tokens)

`globals.css` is the §4.1 file verbatim: `void #050507`, `surface #0b0b10`,
`surface-2 #12121a`, hairline/grid-line whites, `text/faint` scale,
`accent #6366f1`, `accent-2 #a855f7`, `cyan/emerald/amber/rose`;
Geist sans (`-0.02em/-0.01em`), JetBrains Mono for code/metrics/kbd/prices only;
radii 8/12/20/28/full; `py-24/md:py-32`, `max-w-6xl` (`7xl` hero/diagrams);
out-expo ease, spring 300/30, 150/300/600ms; `liquid-glass` floating-only
(≤3/viewport), `flat-card` default, `raycast-glow` 600px, `grid-backdrop`,
`shimmer` skeletons; fallbacks for no-backdrop-filter, reduced-transparency,
mobile blur 14px, reduced-motion kill-switch. Dark-only (`color-scheme: dark`).
Motion budget per §5 (hero once, navbar, hovers, state changes, ribbon once,
synergy only; LED ping + live dot exceptions).

## 8. Config, env, scripts

- `.env.local` (from `.env.local.example`): `NEXT_PUBLIC_SITE_URL`,
  `API_BASE_URL` + `NEXT_PUBLIC_API_BASE_URL` (`http://localhost:8000`),
  `NEXT_PUBLIC_CAL_LINK` (empty → fallback card), `NEXT_PUBLIC_API_MOCKING`
  (`disabled`; `enabled` = fixtures)
- CORS: backend allowlist must include `http://localhost:3000` (verified live);
  frontend never asks for `*`
- Scripts: `dev / build / start / lint / typecheck / test / gen:api`
- `eslint.config.mjs`: disables `react-hooks/error-boundaries` (server try/catch
  around `await` is the Next.js pattern) and `react-hooks/set-state-in-effect`
  (mount-time init) — documented in PROGRESS.md
- Git: repo initialized, single commit `2378ae2 Initial commit`, tree clean

## 9. Placeholders (need real content before launch)

Per `docs/CONTENT_TODO.md`: `site.ts` (name/email/phone/address/hours/responseTime/
calLink/social), `metrics.ts` (4 figures), `team.ts`, `process.ts`
(`securityCommitments`). Backend-side gates (not frontend): placeholder case studies
(`is_placeholder=true`), secrets/SMTP/Slack/CORS/pricing review, AI keys (else RAG
`fallback` demo mode — badge shown, never hidden).

## 10. Run

```bash
cp .env.local.example .env.local
pnpm install
pnpm dev                                  # http://localhost:3000
NEXT_PUBLIC_API_MOCKING=enabled pnpm dev  # without backend
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```
