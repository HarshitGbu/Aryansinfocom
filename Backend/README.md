# Agency API

Tech Agency Platform API — FastAPI + Postgres(pgvector) + Redis + ARQ.

## Run locally (3 commands)

```bash
cp .env.example .env
docker compose up --build
curl http://localhost:8000/health
```

API base: `http://localhost:8000/api/v1`. Frontend origin: set `CORS_ORIGINS` to the site URL.

## Useful

- `make migrate` / `make seed` / `make openapi` / `make test` / `make lint` / `make typecheck`
- `make purge-lead EMAIL=someone@example.com`
- Docs: `http://localhost:8000/docs`, committed spec `docs/openapi.json`

## Launch gates (also warned at startup in production)

1. Replace all `is_placeholder` case studies with real, client-approved content.
2. Set `ADMIN_API_KEY`, `IP_HASH_SALT`, `CAL_WEBHOOK_SECRET`, SMTP/Slack to real values.
3. Set `CORS_ORIGINS` to the production site only.
4. Review `pricing.v1.json`; bump `version` on any change.
5. Configure AI provider keys or leave demo in `fallback` mode.

## Curl examples

```bash
curl http://localhost:8000/api/v1/services
curl http://localhost:8000/api/v1/services/web-apps
curl "http://localhost:8000/api/v1/case-studies?filter=all&limit=12&offset=0"
curl http://localhost:8000/api/v1/hardware-blueprints/BLUEPRINT-AIRGAP-25
curl -X POST http://localhost:8000/api/v1/estimate/calculate -H 'Content-Type: application/json' -d '{"selected_services":["custom_web","erp_custom","office_networking","local_ai_server"],"office_parameters":{"workstations":25,"floor_area_sqft":3500,"require_server_rack":true,"air_gapped_security":true},"software_parameters":{"user_roles_count":4,"third_party_integrations":["stripe","salesforce"]}}'
curl -X POST http://localhost:8000/api/v1/estimate/submit -H 'Content-Type: application/json' -d '{"client_name":"Jane","client_email":"jane@example.com","estimate_input":{"selected_services":["custom_web"],"office_parameters":{"workstations":0,"floor_area_sqft":0,"require_server_rack":false,"air_gapped_security":false},"software_parameters":{"user_roles_count":1,"third_party_integrations":[]}},"consent":true}'
curl -X POST http://localhost:8000/api/v1/contact -H 'Content-Type: application/json' -d '{"name":"Jane","email":"jane@example.com","message":"Hello, need a quote for ERP.","consent":true}'
curl -X POST http://localhost:8000/api/v1/playground/prompt-parse -H 'Content-Type: application/json' -d '{"prompt":"Design VLAN 10 office wifi with firewall"}'
curl -X POST http://localhost:8000/api/v1/playground/rag-simulation -H 'Content-Type: application/json' -d '{"query":"How is AI inference isolated?","top_k":2}'
curl "http://localhost:8000/api/v1/search?q=erp&limit=8"
curl http://localhost:8000/api/v1/admin/leads -H 'X-Admin-Key: $ADMIN_API_KEY'
```
