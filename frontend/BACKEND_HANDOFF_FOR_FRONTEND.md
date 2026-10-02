# Backend Handoff Report → Frontend Agent
**From: Project Manager | Date: 2026-10-02 | To: Frontend Agent (MiMo v2.6 / OpenCode)**

## 1. Backend audit verdict
Backend is **functionally complete, delivery-incomplete**. Do NOT wait for backend.

- **Status:** M0–M7 DONE, M8 PARTIAL. Source: `Backend/PROJECT_PROGRESS.md`.
- **Tests:** 22 passed. Coverage 63% overall (target 85%), pricing 94% (target 95%). `mypy --strict` has 89 pending errors (mostly `Any` generics). None of this blocks you — all 17 API paths work.
- **Spec:** `Backend/docs/openapi.json` committed (17 paths). `Backend/README.md` + `Backend/docs/HANDOFF.md` exist.
- **Launch gates still open (backend side, not yours):** `is_placeholder=true` case studies must be replaced before prod; secrets/SMTP/Slack/CORS/pricing review pending; AI defaults to `fallback` demo mode unless keys set.

**Your law:** Appendix A in `frontend_engineering_prompt_aiweb.md` = Appendix A in `backend_engineering_prompt_aiweb.md`. If prompt body conflicts with Appendix A, Appendix A wins. Verified byte-identical contract types.

## 2. Integration basics (do this first)
- **Base URLs:**
  - Server: `API_BASE_URL=http://localhost:8000`
  - Browser: `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`
  - API prefix: `http://localhost:8000/api/v1`. Health: `http://localhost:8000/health`, `/health/ready`.
- **CORS:** Backend allowlist from `CORS_ORIGINS` (dev: `http://localhost:3000`). Methods `GET/POST/PATCH/OPTIONS`, no credentials. If you get CORS errors, backend is correct — fix your origin/env, do not ask backend to use `*`.
- **Envelopes (all endpoints):**
  - Success: `{ "success": true, ...payload }`
  - Error: `{ "success": false, "error": { "code", "message", "details?" } }`
  - Codes: `validation_error(422), not_found(404), rate_limited(429+Retry-After), unauthorized(401), payload_too_large(413), ai_unavailable(503), internal_error(500)`.
- **Headers:** Every response has `X-Request-ID`. 429s have `X-RateLimit-Limit/Remaining` + `Retry-After` + `details.retry_after_seconds` — you MUST surface the wait time.
- **Client rules (`src/lib/api/client.ts`):** 10s timeout via `AbortController`, throw typed `ApiError{status,code,message,details}` on `success:false`. Server fetches: content GETs `next:{revalidate:60}`, everything else `cache:"no-store"`.
- **Types:** Hand-write `src/lib/api/types.ts` by copying Appendix A.3 verbatim NOW. Only after `Backend/docs/openapi.json` is reachable add `"gen:api": "openapi-typescript ../Backend/docs/openapi.json -o src/lib/api/api.generated.ts"`. **Warning audited:** current `openapi.json` has empty `{}` response schemas — codegen will NOT give you response types. Appendix A is the truth, not the generated file. Never edit generated files. Never use `any`.
- **Strict backend validation:** all request models `extra="forbid"` + `strict=True` (integers only, no floats, no extra keys). Mirror every limit in `zod` so you never send a 422 you could have prevented.

## 3. Endpoint catalog — what to call, where, how
| Method + Path | Used by page | Query/body, rate limit, cache |
|---|---|---|
| `GET /services` + `GET /services/{slug}` | `/services`, `/services/[slug]`, palette static fallback | `?category?` (web/erp/ai/infrastructure, unknown→422). `120/min`. `Cache-Control: public,max-age=60,stale-while-revalidate=300` + weak ETag, honor `If-None-Match→304`. `revalidate:60`. |
| `GET /case-studies?filter&limit&offset` + `GET /case-studies/{slug}` | Home featured (`?limit=3`), `/work`, `/work/[slug]`, service detail related | `filter=all,web,erp,ai,hardware,hybrid` (default `all`; web/erp/ai match `domains`, hardware/hybrid match `service_category`). `limit` default 12 max 50, `offset`. `120/min`. Same cache as above. Payloads: `{success,case_studies,total}` / `{success,case_study}`. `metrics: MetricItem[]` insertion order, `label`=humanized key, `headline_metrics`=first 2. `cover_image_url` nullable → your placeholder. |
| `GET /hardware-blueprints` + `GET /hardware-blueprints/{code}` | `/ai-lab#airgap` only | `120/min`, same cache. **Must fetch `BLUEPRINT-AIRGAP-25`.** Zones/links exact (6 zones: wan/fw/office:10/servers:20/ai:30/mgmt:99; 7 links, `ai→wan DENY`). Node layout: fixed coordinate map, no auto-layout. Default select `ai`. Egress badges: `none`=rose “No outbound”, `restricted`=amber, `open`=emerald. BOM accordion below. |
| `POST /estimate/calculate` | Home teaser, `/estimator` live summary | Body `EstimateRequest` (see §4). `30/min`. `no-store`. Debounce 400ms, TanStack `placeholderData:keepPreviousData`, cancel in-flight. Never re-implement pricing locally. |
| `POST /estimate/submit` | `/estimator` step 5→6 | Body `LeadSubmitRequest` (see §4). `5 per 10min`. Send `estimate_input` ONLY, never computed numbers — backend recalculates. Returns `{lead_id,status,estimate,booking_url:null\|string}`. Dedupe: same email+input within 10min returns existing lead (treat as success). Honeypot `website` must be sent (empty). `consent:true` literal. |
| `POST /contact` | `/contact` form | Body `ContactRequest`: `name,email,company?,topic?(software/erp/ai/infrastructure/other),message 10..2000,consent:true,website?`. `5 per 10min`. Same honeypot/consent pattern. Returns `{submission_id}`. |
| `POST /playground/rag-simulation` | `/ai-lab#rag` | Body `{query 3..300, top_k 1..5 default 2}`. `10/min + 100/day`. `no-store`. Returns `{retrieved_chunks[{source,score 0..1,chunk}], llm_response ≤600 chars plain text, pipeline[5 in order], total_ms, mode:live\|cached\|fallback}`. Default mode is `fallback` (FakeEmbedding+MockLLM, no keys) — show amber “Demo mode” badge, never hide mode. Animate stages scaled 250–700ms each (total ≤3s) using real `duration_ms`. Errors: 429→show `retry_after_seconds`, 503/network→“demo unavailable”, 422→field message. Prefill query: “How does local air-gapped AI routing work with our hardware firewall?” |
| `POST /playground/prompt-parse` | `/ai-lab#parser` | Body `{prompt 3..500}`. `20/min`. Deterministic rule-based. Returns `{tokens[{text,kind:word\|number\|symbol\|entity\|keyword}], intent{label,confidence 0.35–0.98 never 1}, entities[{text,type:hardware\|network\|software\|compliance\|quantity}], guardrails[always 4:contains_sensitive_data,prompt_injection_patterns,length_within_limit,topic_in_scope], routing{target:local_air_gapped_model\|cloud_model\|blocked,reason}}`. Routing: blocked > local_air_gapped > cloud. |
| `GET /search?q&limit` | `command-palette.tsx` | `q` min 2 chars else 422, `limit` default 8 max 20. `60/min`. `no-store`. Debounce 200ms, only if q≥2. Returns `{results:[{type:service\|case_study\|page\|action,title,subtitle\|null,href}]}`. Hrefs: `/services/{slug}`, `/work/{slug}`. On failure silently fall back to static Navigate/Actions groups. Empty: “No matches. Try “estimate”, “air-gapped”, or “ERP”.” |
| `POST /webhooks/cal`, `GET/PATCH /admin/leads` | **DO NOT CALL from frontend.** Backend-only. | If you need leads UI, stop and ask PM. Do not add admin key to browser bundle. |

## 4. Validation you must mirror in zod (backend rejects otherwise)
- `EstimateRequest`: `selected_services` 1–6 unique of `custom_web,erp_custom,ai_solutions,office_networking,local_ai_server,workstation_provisioning`. `office:{workstations 0..500, floor_area_sqft 0..200000, require_server_rack, air_gapped_security}`. `software:{user_roles_count 0..50, third_party_integrations 0..10 lowercase slug ^[a-z0-9][a-z0-9_-]{0,39}$ ≤40 chars}`. Rule: if any infra service selected then `workstations≥1` else 422. Integers strict.
- `LeadSubmit`: `client_name 2..120, client_email valid, company≤255, phone≤50, notes≤2000, consent===true, website honeypot (hidden, tabindex=-1, autocomplete off, NOT display:none)`.
- `Contact`: same honeypot/consent; `message 10..2000`.
- `RAG`: `query` trim/collapse whitespace, counter max 300. `top_k` selector 1–5 default 2.
- `Parser`: textarea max 500 with counter.
- **Golden test (must pass end-to-end):** calculate with `["custom_web","erp_custom","office_networking","local_ai_server"]`, office `{25,3500,true,true}`, software `{4,["stripe","salesforce"]}` → cost `18500–27000`, timeline `6–10`, breakdown `12000–16000/4000–6000/2500–5000`, blueprint `BLUEPRINT-AIRGAP-25`, `on_premise_airgapped`, `pricing_version 2026-10-v1`. Home teaser defaults differ (10ws/1500sqft/roles 3) — do not assert golden there.

## 5. Page wiring checklist (from your prompt §§8–9 — no shortcuts)
- Home order exact: Hero → Metric ribbon → Capability bento (5 pillars, `pillars.ts`) → Synergy stack (`#synergy`, only GSAP ScrollTrigger, pinned desktop only) → Tech switcher → Featured work (3 cards, quiet error card on API fail, hide if empty) → Estimator teaser → Footer CTA. Hero copy/CTAs from §11.1 verbatim. Hero window: typed `stack.config.ts` + status card (VLAN 30, Outbound blocked, 6 LEDs 4 emerald/1 cyan blink/1 off, GPU bar static 64% aria-hidden). No fake ms numbers.
- Services: 4 panels + Delivery 4-step timeline. Detail: breadcrumb, TOC scroll-spy, `<Markdown>` GFM no raw HTML, related work via `?filter=` (infrastructure→hardware), CTA `?services=` map (web→custom_web etc.).
- Work: filter chips sync `?filter=` via `router.replace(scroll:false)`, `aria-live` count. `CaseCard` whole-card link, hover expand via `grid-template-rows 0fr→1fr`, always-visible on `(hover:none)`. Skeletons/empty/error states per spec.
- Estimator: zustand `estimator:v1` in sessionStorage, clear on success. 6 steps with conditional skip (office only if networking/local_ai/workstation; software only if custom_web/erp/ai). Sliders+number inputs, roles stepper, integration chips+Other→slug. Review shows assumptions list + blueprint link to `/ai-lab#airgap` if contains AIRGAP. Live summary `liquid-glass` sticky desktop / bottom-bar sheet mobile. Disclaimer “Planning estimate, not a quote.” Done screen uses response `estimate` + `booking_url` (null→`/contact#book`).
- AI Lab tabs `#rag,#parser,#airgap`, lazy `next/dynamic ssr:false`. RAG/parser/airgap behaviors per §8.6 table above.
- Contact: Cal embed lazy (empty `NEXT_PUBLIC_CAL_LINK`→fallback card + focus form), location static grid (no map embed), toasts use action verb (“Message sent.” / “Estimate sent.”).
- Shell: floating pill navbar (transparent→glass after 24px, `layoutId="nav-active"`), ⌘K/Ctrl+K + `/` to open, mobile sheet, services dropdown keyboard-accessible. Footer 4 cols, no newsletter. `PROGRESS.md` + `docs/CONTENT_TODO.md` + PLACEHOLDER comments required. `siteConfig.name` default “Company Name” everywhere.

## 6. Agent control — read and obey
1. **Contract is law.** Do not “fix” backend field names. If you think Appendix A is wrong, log in `PROGRESS.md` and continue with contract as written.
2. **No new packages** beyond §6 list unless build forces it — document why in `PROGRESS.md`.
3. **Do NOT re-implement pricing, RAG retrieval, or prompt parsing** in frontend. Mocks (`NEXT_PUBLIC_API_MOCKING=enabled`) return canned fixtures only for building UI before backend runs.
4. **Do not invent content.** Copy deck §11 verbatim. Placeholders only in `src/content/*.ts` with `// PLACEHOLDER`.
5. **Work phased (§15), one phase at a time.** After each: `pnpm typecheck` → `pnpm lint` → `pnpm build`. Fix all errors before next phase. Tick `PROGRESS.md` with what + decisions.
6. **Files <~200 lines, TS strict no `any`, `globals.css` exact from §4.1, tokens exact from §3.** Max 3 glass surfaces/viewport, max 2 static glow blobs/page. Motion budget §5 only; respect `prefers-reduced-motion/transparency`.
7. **Verify by running.** Check 390/768/1440px. Never claim works without running.
8. **Backend quirks to handle, not re-litigate:** placeholder case studies (render as-is), `booking_url` null, dedupe 200, honeypot fake-200, fallback RAG mode default, empty openapi response schemas, ETag/304, body 64KB→413, fail-open GET/fail-closed POST if Redis down.
9. **Out of scope:** admin UI, CMS, auth, payments. Do not build.

**Start now:** scaffold per §6 (`pnpm create next-app`), create `PROGRESS.md` from §15 checklist, then implement `globals.css` + tokens + `lib/api/*` + mocks before any page. First demo gate: Home + palette + estimator teaser calling live `POST /estimate/calculate`.
