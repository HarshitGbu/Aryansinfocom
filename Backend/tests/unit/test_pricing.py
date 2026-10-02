from __future__ import annotations

import random
from pathlib import Path

from app.services.pricing.engine import calculate, load_pricing, validate_estimate_input

PRICING = load_pricing(Path("app/services/pricing/pricing.v1.json"))

GOLDEN_REQ = {
    "selected_services": ["custom_web", "erp_custom", "office_networking", "local_ai_server"],
    "office_parameters": {
        "workstations": 25,
        "floor_area_sqft": 3500,
        "require_server_rack": True,
        "air_gapped_security": True,
    },
    "software_parameters": {"user_roles_count": 4, "third_party_integrations": ["stripe", "salesforce"]},
}


def test_golden() -> None:
    assert not validate_estimate_input(GOLDEN_REQ)
    r = calculate(PRICING, GOLDEN_REQ)
    assert r["cost_range_usd"] == {"min": 18500, "max": 27000}
    assert r["timeline_weeks"] == {"min": 6, "max": 10}
    assert r["breakdown"]["software_development"] == {"min": 12000, "max": 16000}
    assert r["breakdown"]["hardware_and_networking"] == {"min": 4000, "max": 6000}
    assert r["breakdown"]["on_prem_ai_setup"] == {"min": 2500, "max": 5000}
    assert r["recommended_blueprint"] == "BLUEPRINT-AIRGAP-25"
    assert r["ai_deployment_type"] == "on_premise_airgapped"
    assert r["pricing_version"] == "2026-10-v1"


def test_each_single_and_pairs_and_all() -> None:
    singles = [
        ["custom_web"],
        ["erp_custom"],
        ["ai_solutions"],
        ["office_networking"],
        ["local_ai_server"],
        ["workstation_provisioning"],
    ]
    for s in singles:
        req = {
            "selected_services": s,
            "office_parameters": {
                "workstations": 5
                if any(x in s for x in ("office_networking", "local_ai_server", "workstation_provisioning"))
                else 0,
                "floor_area_sqft": 500 if "office_networking" in s else 0,
                "require_server_rack": False,
                "air_gapped_security": False,
            },
            "software_parameters": {"user_roles_count": 1, "third_party_integrations": []},
        }
        assert not validate_estimate_input(req), s
        r = calculate(PRICING, req)
        assert r["cost_range_usd"]["min"] <= r["cost_range_usd"]["max"]
        assert r["timeline_weeks"]["min"] <= r["timeline_weeks"]["max"]
    # pairs
    assert (
        calculate(
            PRICING,
            {
                "selected_services": ["custom_web", "erp_custom"],
                "office_parameters": {
                    "workstations": 0,
                    "floor_area_sqft": 0,
                    "require_server_rack": False,
                    "air_gapped_security": False,
                },
                "software_parameters": {"user_roles_count": 0, "third_party_integrations": []},
            },
        )["cost_range_usd"]["min"]
        > 0
    )
    all6 = {
        "selected_services": [
            "custom_web",
            "erp_custom",
            "ai_solutions",
            "office_networking",
            "local_ai_server",
            "workstation_provisioning",
        ],
        "office_parameters": {
            "workstations": 30,
            "floor_area_sqft": 5000,
            "require_server_rack": True,
            "air_gapped_security": True,
        },
        "software_parameters": {"user_roles_count": 5, "third_party_integrations": ["a", "b", "c"]},
    }
    r = calculate(PRICING, all6)
    assert set(r["breakdown"]) == {"software_development", "hardware_and_networking", "on_prem_ai_setup"}


def test_rounding_property() -> None:
    rng = random.Random(42)
    svcs = [
        "custom_web",
        "erp_custom",
        "ai_solutions",
        "office_networking",
        "local_ai_server",
        "workstation_provisioning",
    ]
    for _ in range(200):
        n = rng.randint(1, 6)
        sel = rng.sample(svcs, n)
        infra = any(s in ("office_networking", "local_ai_server", "workstation_provisioning") for s in sel)
        req = {
            "selected_services": sel,
            "office_parameters": {
                "workstations": rng.randint(1, 100) if infra else rng.randint(0, 10),
                "floor_area_sqft": rng.randint(0, 20000),
                "require_server_rack": bool(rng.randint(0, 1)),
                "air_gapped_security": bool(rng.randint(0, 1)),
            },
            "software_parameters": {
                "user_roles_count": rng.randint(0, 50),
                "third_party_integrations": [f"int{i}" for i in range(rng.randint(0, 4))],
            },
        }
        assert not validate_estimate_input(req)
        r = calculate(PRICING, req)
        b = r["breakdown"]
        smin = sum(v["min"] for v in b.values())
        smax = sum(v["max"] for v in b.values())
        assert smin == r["cost_range_usd"]["min"]
        assert smax == r["cost_range_usd"]["max"]
        assert r["cost_range_usd"]["min"] <= r["cost_range_usd"]["max"]
        assert r["timeline_weeks"]["min"] <= r["timeline_weeks"]["max"]


def test_monotonicity() -> None:
    base = {
        "selected_services": ["custom_web", "office_networking"],
        "office_parameters": {
            "workstations": 5,
            "floor_area_sqft": 1000,
            "require_server_rack": False,
            "air_gapped_security": False,
        },
        "software_parameters": {"user_roles_count": 2, "third_party_integrations": ["x"]},
    }
    b0 = calculate(PRICING, base)["cost_range_usd"]
    bigger = {
        "selected_services": ["custom_web", "office_networking"],
        "office_parameters": {
            "workstations": 6,
            "floor_area_sqft": 1100,
            "require_server_rack": False,
            "air_gapped_security": False,
        },
        "software_parameters": {"user_roles_count": 3, "third_party_integrations": ["x", "y"]},
    }
    b1 = calculate(PRICING, bigger)["cost_range_usd"]
    assert b1["min"] >= b0["min"] and b1["max"] >= b0["max"]


def test_boundaries() -> None:
    # infra with 0 workstations invalid
    assert validate_estimate_input(
        {
            "selected_services": ["office_networking"],
            "office_parameters": {
                "workstations": 0,
                "floor_area_sqft": 0,
                "require_server_rack": False,
                "air_gapped_security": False,
            },
            "software_parameters": {"user_roles_count": 0, "third_party_integrations": []},
        }
    )

    # blueprint switches 10/11 and 25/26
    def bp(ws: int) -> str | None:
        return calculate(
            PRICING,
            {
                "selected_services": ["office_networking"],
                "office_parameters": {
                    "workstations": ws,
                    "floor_area_sqft": 1000,
                    "require_server_rack": False,
                    "air_gapped_security": False,
                },
                "software_parameters": {"user_roles_count": 0, "third_party_integrations": []},
            },
        )["recommended_blueprint"]

    assert bp(10) == "BLUEPRINT-OFFICE-10"
    assert bp(11) == "BLUEPRINT-OFFICE-25"
    assert bp(26) == "BLUEPRINT-ENTERPRISE-100"
    # max values valid
    assert not validate_estimate_input(
        {
            "selected_services": ["custom_web"],
            "office_parameters": {
                "workstations": 500,
                "floor_area_sqft": 200000,
                "require_server_rack": False,
                "air_gapped_security": False,
            },
            "software_parameters": {"user_roles_count": 50, "third_party_integrations": [f"i{i}" for i in range(10)]},
        }
    )
