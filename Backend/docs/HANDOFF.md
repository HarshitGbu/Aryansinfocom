# Handoff

## Run locally (3 commands)
```bash
cp .env.example .env
docker compose up --build
curl http://localhost:8000/health
```

## Env vars
See `.env.example` for full list: ENVIRONMENT, DATABASE_URL, REDIS_URL, CORS_ORIGINS, ADMIN_API_KEY (≥32 chars), IP_HASH_SALT, PUBLIC_BOOKING_URL, CAL_WEBHOOK_SECRET (empty → webhook 404), EMBEDDING_PROVIDER (fake|openai), OPENAI_API_KEY, LLM_PROVIDER (mock|anthropic), ANTHROPIC_API_KEY, LLM_MODEL (never hard-coded), RAG_DAILY_BUDGET, SMTP_URL (empty → log), NOTIFY_EMAIL_TO, SLACK_WEBHOOK_URL, SENTRY_DSN, PRICING_FILE, TRUSTED_PROXY_HOPS (default 1), GIT_SHA.

## Frontend integration
- Base URL: `http://localhost:8000/api/v1` (prod: API origin). CORS: set `CORS_ORIGINS` to exact site origin(s), comma-separated; methods GET/POST/PATCH/OPTIONS; no credentials.
- Types: regenerate with `npx openapi-typescript docs/openapi.json -o src/api/types.ts`. Regenerate backend spec: `make openapi` (writes `docs/openapi.json`; CI fails on diff).
- Envelopes: success `{success:true,...}`, error `{success:false,error:{code,message,details?}}`; `X-Request-ID` echoed.

## Live AI providers
- Set `EMBEDDING_PROVIDER=openai` + `OPENAI_API_KEY` (text-embedding-3-small, 1536 dims), `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY` + `LLM_MODEL`; reseed to re-embed (`metadata.provider` tracks). Without keys app runs `fallback` (lexical + extractive) and `mock` LLM. `RAG_DAILY_BUDGET` caps live runs/IP/day.

## Deviations
See `docs/DEVIATIONS.md` (none load-bearing; contract unchanged).
