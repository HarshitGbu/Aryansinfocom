from __future__ import annotations

from app.services.lead_scoring import score_lead


def _est(mx: int, dep: str = "none") -> dict:
    return {"cost_range_usd": {"min": 0, "max": mx}, "ai_deployment_type": dep}


def test_budget_tiers() -> None:
    assert score_lead(_est(9000), None, None, None, ["custom_web"], 1) == 0
    assert score_lead(_est(15000), None, None, None, ["custom_web"], 1) == 10
    assert score_lead(_est(30000), None, None, None, ["custom_web"], 1) == 20


def test_services_company_phone() -> None:
    assert score_lead(_est(0), None, None, None, ["a", "b", "c"], 1) >= 15
    assert score_lead(_est(0), "Acme", None, None, ["custom_web"], 1) >= 15
    assert score_lead(_est(0), None, "123", None, ["custom_web"], 1) >= 10


def test_erp_airgap_workstations_notes() -> None:
    assert score_lead(_est(0), None, None, None, ["erp_custom"], 1) >= 15
    assert score_lead(_est(0, "on_premise_airgapped"), None, None, None, ["custom_web"], 1) >= 15
    assert score_lead(_est(0), None, None, None, ["custom_web"], 25) >= 10
    assert score_lead(_est(0), None, None, "x" * 40, ["custom_web"], 1) >= 5
    assert (
        score_lead(_est(999999, "on_premise_airgapped"), "C", "P", "y" * 50, ["a", "b", "c", "erp_custom"], 30) <= 100
    )
