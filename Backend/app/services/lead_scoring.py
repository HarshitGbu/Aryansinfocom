from __future__ import annotations


def score_lead(
    estimate: dict,
    company_name: str | None,
    phone_number: str | None,
    notes: str | None,
    selected: list[str],
    workstations: int,
) -> int:
    score = 0
    mx = int(estimate["cost_range_usd"]["max"])
    if mx >= 25000:
        score += 20
    elif mx >= 10000:
        score += 10
    if len(selected) >= 3:
        score += 15
    if company_name:
        score += 15
    if phone_number:
        score += 10
    if "erp_custom" in selected or estimate.get("ai_deployment_type") == "on_premise_airgapped":
        score += 15
    if workstations >= 25:
        score += 10
    if notes and len(notes) >= 40:
        score += 5
    return min(100, score)
