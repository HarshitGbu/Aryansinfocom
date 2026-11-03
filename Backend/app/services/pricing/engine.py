from __future__ import annotations

import json
import math
import re
from pathlib import Path

_INTEGRATION_RE = re.compile(r"^[a-z0-9][a-z0-9_-]{0,39}$")
VALID_SERVICES = {
    "custom_web",
    "erp_custom",
    "ai_solutions",
    "office_networking",
    "local_ai_server",
    "workstation_provisioning",
}


def load_pricing(path: str | Path) -> dict:
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def round50(x: int, base: int = 50) -> int:
    # nearest half-up
    return int(math.floor((x + base / 2) / base) * base)


def validate_estimate_input(data: dict) -> dict[str, list[str]]:
    """Return field errors; empty means valid. Used by API to build 422 details."""
    errors: dict[str, list[str]] = {}
    sel = data.get("selected_services", [])
    if not isinstance(sel, list) or not (1 <= len(sel) <= 6):
        errors.setdefault("selected_services", []).append("must contain 1..6 services")
    elif len(set(sel)) != len(sel):
        errors.setdefault("selected_services", []).append("must be unique")
    elif any(s not in VALID_SERVICES for s in sel):
        errors.setdefault("selected_services", []).append("unknown service")
    office = data.get("office_parameters") or {}
    sw = data.get("software_parameters") or {}
    ws = int(office.get("workstations", 0))
    sqft = int(office.get("floor_area_sqft", 0))
    roles = int(sw.get("user_roles_count", 0))
    integ = sw.get("third_party_integrations", []) or []
    infra = {"office_networking", "local_ai_server", "workstation_provisioning"}
    if any(s in infra for s in sel) and ws < 1:
        errors.setdefault("office_parameters.workstations", []).append(
            "workstations must be >= 1 when infrastructure services selected"
        )
    if not (0 <= ws <= 500):
        errors.setdefault("office_parameters.workstations", []).append("must be 0..500")
    if not (0 <= sqft <= 200000):
        errors.setdefault("office_parameters.floor_area_sqft", []).append("must be 0..200000")
    if not (0 <= roles <= 50):
        errors.setdefault("software_parameters.user_roles_count", []).append("must be 0..50")
    if len(integ) > 10:
        errors.setdefault("software_parameters.third_party_integrations", []).append("at most 10 integrations")
    for it in integ:
        if not isinstance(it, str) or len(it) > 40 or not _INTEGRATION_RE.match(it):
            errors.setdefault("software_parameters.third_party_integrations", []).append(
                f"invalid integration slug: {it!r}"
            )
            break
    return errors


def calculate(pricing: dict, req: dict) -> dict:
    sel: list[str] = list(req.get("selected_services", []))
    office: dict = req.get("office_parameters") or {}
    sw: dict = req.get("software_parameters") or {}
    ws: int = int(office.get("workstations", 0))
    sqft: int = int(office.get("floor_area_sqft", 0))
    rack: bool = bool(office.get("require_server_rack", False))
    airgap: bool = bool(office.get("air_gapped_security", False))
    roles: int = int(sw.get("user_roles_count", 0))
    integ: list[str] = list(sw.get("third_party_integrations", []) or [])

    rnd: int = int(pricing.get("rounding", 50))

    # 1. software line
    sw_min = 0
    sw_max = 0
    has_software = any(s in ("custom_web", "erp_custom", "ai_solutions") for s in sel)
    if has_software:
        for s in sel:
            if s in pricing["software"]["services"]:
                c = pricing["software"]["services"][s]["cost"]
                sw_min += c[0]
                sw_max += c[1]
        pur = pricing["software"]["per_user_role"]
        sw_min += roles * pur[0]
        sw_max += roles * pur[1]
        pi = pricing["software"]["per_integration"]
        sw_min += len(integ) * pi[0]
        sw_max += len(integ) * pi[1]

    # 2. hardware line
    hw_min = 0
    hw_max = 0
    has_hw_line = False
    if "office_networking" in sel:
        has_hw_line = True
        o = pricing["hardware"]["office_networking"]
        import math as _m

        units = _m.ceil(int(_m.floor(sqft / 100)))
        hw_min += o["base"][0] + ws * o["per_workstation"][0] + units * o["per_100_sqft"][0]
        hw_max += o["base"][1] + ws * o["per_workstation"][1] + units * o["per_100_sqft"][1]
    if rack and ("office_networking" in sel or "local_ai_server" in sel):
        has_hw_line = True
        sr = pricing["hardware"]["server_rack"]["cost"]
        hw_min += sr[0]
        hw_max += sr[1]
    if "workstation_provisioning" in sel:
        has_hw_line = True
        wp = pricing["hardware"]["workstation_provisioning"]["per_workstation"]
        hw_min += ws * wp[0]
        hw_max += ws * wp[1]

    # 3. on-prem AI
    ai_min = 0
    ai_max = 0
    has_ai_line = False
    if "local_ai_server" in sel:
        has_ai_line = True
        c = pricing["on_prem_ai"]["local_ai_server"]["cost"]
        ai_min += c[0]
        ai_max += c[1]
    apply_hardening = "local_ai_server" in sel and airgap
    if apply_hardening:
        has_ai_line = True
        c = pricing["on_prem_ai"]["air_gap_hardening"]["cost"]
        ai_min += c[0]
        ai_max += c[1]

    # 4. rounding per-line then sum
    sw_min_r, sw_max_r = round50(sw_min, rnd), round50(sw_max, rnd)
    hw_min_r, hw_max_r = round50(hw_min, rnd), round50(hw_max, rnd)
    ai_min_r, ai_max_r = round50(ai_min, rnd), round50(ai_max, rnd)
    # zero out lines that don't apply, then sum once
    if not has_software:
        sw_min_r = sw_max_r = 0
    if not has_hw_line:
        hw_min_r = hw_max_r = 0
    if not has_ai_line:
        ai_min_r = ai_max_r = 0
    total_min = sw_min_r + hw_min_r + ai_min_r
    total_max = sw_max_r + hw_max_r + ai_max_r

    breakdown: dict = {}
    if sw_max_r > 0:
        breakdown["software_development"] = {"min": sw_min_r, "max": sw_max_r}
    if hw_max_r > 0:
        breakdown["hardware_and_networking"] = {"min": hw_min_r, "max": hw_max_r}
    if ai_max_r > 0:
        breakdown["on_prem_ai_setup"] = {"min": ai_min_r, "max": ai_max_r}

    # 5. timeline
    sw_wmin = sw_wmax = 0
    for s in sel:
        if s in pricing["software"]["services"]:
            w = pricing["software"]["services"][s]["weeks"]
            sw_wmin += w[0]
            sw_wmax += w[1]
    hw_wmin = hw_wmax = 0
    if "office_networking" in sel:
        w = pricing["hardware"]["office_networking"]["weeks"]
        hw_wmin += w[0]
        hw_wmax += w[1]
    if "workstation_provisioning" in sel:
        w = pricing["hardware"]["workstation_provisioning"]["weeks"]
        hw_wmin += w[0]
        hw_wmax += w[1]
    if "local_ai_server" in sel:
        w = pricing["on_prem_ai"]["local_ai_server"]["weeks"]
        hw_wmin += w[0]
        hw_wmax += w[1]
    if apply_hardening:
        w = pricing["on_prem_ai"]["air_gap_hardening"]["weeks"]
        hw_wmin += w[0]
        hw_wmax += w[1]
    if has_software:
        buf = pricing["timeline"]["integration_buffer_weeks"]
        th = pricing["timeline"]["extra_buffer_per_integration_over"]["threshold"]
        ex = pricing["timeline"]["extra_buffer_per_integration_over"]["weeks"]
        over = max(0, len(integ) - th)
        bmin = buf[0] + over * ex[0]
        bmax = buf[1] + over * ex[1]
    else:
        bmin = bmax = 0
    tmin = max(sw_wmin, hw_wmin) + bmin
    tmax = max(sw_wmax, hw_wmax) + bmax

    # 7. deployment type
    has_ai_sol = "ai_solutions" in sel
    has_local = "local_ai_server" in sel
    if not has_ai_sol and not has_local:
        dep = "none"
    elif has_local and airgap:
        dep = "on_premise_airgapped"
    elif has_local and not airgap:
        dep = "hybrid"
    else:
        dep = "cloud"

    # 8. blueprint
    needs_bp = any(s in ("office_networking", "local_ai_server", "workstation_provisioning") for s in sel)
    bp = None
    if needs_bp:
        b = pricing["blueprints"]
        if has_local and airgap:
            bp = b["enterprise"] if ws > 25 else b["airgap_standard"]
        elif ws > 25:
            bp = b["enterprise"]
        elif ws > 10:
            bp = b["office_mid"]
        else:
            bp = b["office_small"]

    # 9. assumptions
    assumptions = [
        "GPU and server hardware procurement is quoted separately.",
        "Third-party licences and subscriptions are excluded.",
        "Figures are planning estimates; a discovery call confirms final scope.",
    ]
    if airgap and not has_local:
        assumptions.append("Air-gap hardening applies only when a local AI server is selected.")
    if not has_software and len(integ) > 0:
        assumptions.append("Integrations are counted only with software development.")
    if ws > 25:
        assumptions.append("Sites above 25 seats follow the enterprise blueprint.")
    return {
        "cost_range_usd": {"min": total_min, "max": total_max},
        "timeline_weeks": {"min": tmin, "max": tmax},
        "breakdown": breakdown,
        "recommended_blueprint": bp,
        "ai_deployment_type": dep,
        "assumptions": assumptions,
        "pricing_version": pricing.get("version", ""),
    }
