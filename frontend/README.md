# Frontend — Tech Agency Website

Next.js 16 + Tailwind v4. Contract: Appendix A in `frontend_engineering_prompt_aiweb.md` is law.

## Setup

```bash
cp .env.local.example .env.local
pnpm install
pnpm dev
```

Env vars: `NEXT_PUBLIC_SITE_URL`, `API_BASE_URL` (server), `NEXT_PUBLIC_API_BASE_URL` (browser),
`NEXT_PUBLIC_CAL_LINK`, `NEXT_PUBLIC_API_MOCKING` (`enabled` uses `src/lib/api/mocks.ts`).

Backend: `http://localhost:8000`, prefix `/api/v1`. CORS allows `http://localhost:3000`.

## Scripts

- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — eslint
- `pnpm build` — production build
- `pnpm test` — vitest
- `pnpm gen:api` — `openapi-typescript ../Backend/docs/openapi.json -o src/lib/api/api.generated.ts`
  (warning: current openapi has empty response schemas; Appendix A is truth)

## Notes

- Types hand-written in `src/lib/api/types.ts` from Appendix A.3.
- Golden estimate: A.4 request → `$18,500 – $27,000`, `6–10 weeks`, blueprint `BLUEPRINT-AIRGAP-25`.
- Estimator draft persists in `sessionStorage` (`estimator:v1`), cleared on success.
