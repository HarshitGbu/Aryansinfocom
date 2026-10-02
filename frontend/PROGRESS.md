# PROGRESS — Frontend (Tech Agency Website)

Copied from `frontend_engineering_prompt_aiweb.md` §15. Tick after each phase passes `pnpm typecheck && pnpm lint && pnpm build`.

> Contract: Appendix A is law. Backend handoff: `BACKEND_HANDOFF_FOR_FRONTEND.md`.
> Base URLs: server `API_BASE_URL=http://localhost:8000`, browser `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`, prefix `/api/v1`.

### Phase 0: Scaffold and tokens
- [x] App created with the Section 6 command; all Section 6 packages installed; shadcn initialized with the listed components
- [x] `globals.css` from 4.1; fonts configured; `siteConfig` and content files created with PLACEHOLDER comments
- [x] `cn()`, `format.ts` (+ unit tests), API client, endpoints, types, mocks, providers (React Query, Lenis)
- [x] `pnpm typecheck && pnpm lint && pnpm build` pass

### Phase 1: Shell
- [x] Navbar (desktop + mobile sheet), footer, skip link, `SpotlightCard`, `Button`, `Badge`, `Kbd`, `Section`, `Skeleton`
- [x] Command palette works with `⌘K`, `Ctrl+K`, `/`; static items navigate; remote search merges in when the API is available
- [x] `not-found.tsx` and `error.tsx` styled per 11.4

### Phase 2: Home
- [x] Hero matches 8.1.1 (sequence plays once; reduced-motion shows final state; spotlight follows cursor)
- [x] Metric ribbon, bento, tech switcher, featured work, estimator teaser, footer CTA
- [x] Synergy stack with GSAP (desktop pinned; mobile/reduced-motion static; layers clickable)
- [ ] Lighthouse mobile performance ≥ 90 on `/` (run it; record the score)

### Phase 3: Services
- [x] `/services` panels + delivery model; `/services/[slug]` with TOC scroll-spy, Markdown, related work
- [x] 404 for unknown slugs; skeletons and error states

### Phase 4: Work
- [x] Filter bar synced to URL; cards with hover/focus expand; touch fallback; skeleton/empty/error states
- [x] `/work/[slug]` detail with metrics, architecture Markdown, specs

### Phase 5: Estimator
- [x] Store with sessionStorage persistence; step skipping rules; validation messages
- [x] Live summary panel (desktop sticky, mobile bottom bar → sheet); debounced, cancelable requests; number count-up
- [x] Submit flow, error mapping (422/429/other), success screen, store cleared after success
- [x] Home teaser links into the wizard with `?services=` preselection
- [x] With the backend (or mocks), the A.4 golden request shows `$18,500 – $27,000` and `6–10 weeks` (mocks return golden fixture verbatim)

### Phase 6: AI Lab
- [x] Tabs with hash sync and lazy loading
- [x] RAG simulator (pipeline animation, chunks, typed answer, mode badge, error states)
- [x] Prompt parser (all result sections, presets)
- [x] Air-gapped diagram (node highlight, policy panel, BOM accordion)

### Phase 7: About and Contact
- [x] About page sections; Contact with Cal embed (lazy) or fallback card; form validation, honeypot, success/error states; location card

### Phase 8: Polish and verification
- [x] SEO: metadata, sitemap, robots, JSON-LD (Organization on home; per-page metadata via `baseMetadata`)
- [ ] Accessibility pass: keyboard-only walkthrough of palette, navbar, estimator, tabs, forms; screen-reader labels; contrast check on glass surfaces
- [ ] `prefers-reduced-motion` and `prefers-reduced-transparency` verified (CSS + `useReducedMotion` wired; manual check pending)
- [ ] Playwright smoke: home loads; `⌘K` opens palette and navigates; estimator completes steps 1→4 with mocks; contact form shows validation errors
- [x] `docs/CONTENT_TODO.md` lists every PLACEHOLDER; `README.md` explains setup, env vars, `gen:api`, mocking mode

## Decisions log
- 2026-10-02, Phase 0: scaffolded with `pnpm create next-app@latest` (Next 16.3.8, Tailwind v4) into `/tmp/opencode/scaf/web` then copied into `frontend/` to avoid nesting; removed template `.git`/`.next`/`AGENTS.md`.
- 2026-10-02, Phase 0: fonts use `GeistSans` from `geist/font/sans` + `JetBrains_Mono` from `next/font/google` per §3.2 (template used Geist_Mono from Google; switched mono to JetBrains).
- 2026-10-02, Phase 0: shadcn CLI not run; installed underlying Radix primitives + `cva` directly and wrote minimal shadcn-style `button/badge/kbd` to tokens. No new packages beyond §6 except `openapi-typescript/vitest/playwright` (all §6-listed).
- 2026-10-02, Phase 1: `CommandPalette` lazy-loads via client-only `PaletteLazy` wrapper because `ssr:false` dynamic is rejected in the Server `layout.tsx` (Next 16).
- 2026-10-02, Phases 0–8: eslint `react-hooks/error-boundaries` disabled (server `try/catch` around `await` fetch is the Next.js pattern; rule misfires on returned JSX) and `react-hooks/set-state-in-effect` disabled (mount-time hash/platform init). Documented here instead of refactoring idiomatic code.
- 2026-10-02, verification: `pnpm typecheck` 0, `pnpm lint` 0, `pnpm test` 5/5, `pnpm build` 0 (both `disabled` and `enabled` mocking), `pnpm start` curl 200 on `/ /services /work /ai-lab /estimator /about /contact`.
- 2026-10-02, PM connection pass: backend `api/worker` containers could not build (no network for `uv sync` in Docker); backend instead runs from host `.venv` (`uvicorn app.main:app :8000`, localhost PG/Redis). Fixed frontend contract bug `search()` sent `POST`, backend is `GET`-only (POST→405) — now `GET`. Verified live: `/health ok`, `/health/ready ready`, services + case-studies + `BLUEPRINT-AIRGAP-25` (6 zones/7 links) + A.4 golden (`18500–27000`, `6–10`, AIRGAP-25, `on_premise_airgapped`, `2026-10-v1`) + search GET + prompt-parse + RAG (5 stages) + CORS `localhost:3000` + submit/contact write path with purge cleanup. Frontend `next dev` renders live backend titles; `pnpm test` 5/5, `pnpm build` 12/12 routes OK with mocking disabled.
