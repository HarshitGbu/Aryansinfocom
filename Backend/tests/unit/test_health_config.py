from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app


def test_health() -> None:
    app = create_app()
    c = TestClient(app)
    r = c.get("/health")
    assert r.status_code == 200
    assert r.json()["success"] is True
    assert r.json()["status"] == "ok"
    assert "X-Request-ID" in r.headers


def test_serializers() -> None:
    from app.api.v1.case_studies import humanize, to_metrics

    assert humanize("latency_reduction") == "Latency reduction"
    m = to_metrics({"latency_reduction": "45%", "cost_savings": "$50k/yr"})
    assert m[0]["label"] == "Latency reduction"
    assert m[1]["label"] == "Cost savings"
