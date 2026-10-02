from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


def test_openapi_contract() -> None:
    app = create_app()
    c = TestClient(app)
    spec = app.openapi()
    paths = spec["paths"]
    for p in [
        "/api/v1/services",
        "/api/v1/case-studies",
        "/api/v1/hardware-blueprints",
        "/api/v1/estimate/calculate",
        "/api/v1/estimate/submit",
        "/api/v1/contact",
        "/api/v1/playground/rag-simulation",
        "/api/v1/playground/prompt-parse",
        "/api/v1/search",
        "/api/v1/webhooks/cal",
        "/api/v1/admin/leads",
    ]:
        assert p in paths, p
    # golden via HTTP (no DB needed for calculate)
    r = c.post(
        "/api/v1/estimate/calculate",
        json={
            "selected_services": ["custom_web", "erp_custom", "office_networking", "local_ai_server"],
            "office_parameters": {
                "workstations": 25,
                "floor_area_sqft": 3500,
                "require_server_rack": True,
                "air_gapped_security": True,
            },
            "software_parameters": {"user_roles_count": 4, "third_party_integrations": ["stripe", "salesforce"]},
        },
    )
    assert r.status_code == 200, r.text
    est = r.json()["estimate"]
    assert est["cost_range_usd"] == {"min": 18500, "max": 27000}
    assert est["timeline_weeks"] == {"min": 6, "max": 10}
