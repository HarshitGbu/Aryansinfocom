from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

ServiceCategory = Literal["web", "erp", "ai", "infrastructure"]
CaseStudyCategory = Literal["software", "hardware", "hybrid"]
CaseStudyFilter = Literal["all", "web", "erp", "ai", "hardware", "hybrid"]
EstimatorService = Literal[
    "custom_web", "erp_custom", "ai_solutions", "office_networking", "local_ai_server", "workstation_provisioning"
]
AiDeploymentType = Literal["cloud", "on_premise_airgapped", "hybrid", "none"]
LeadStatus = Literal["new", "contacted", "discovery_booked", "closed"]


class StrictBase(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)


class Range(StrictBase):
    min: int
    max: int


class ServiceSummary(StrictBase):
    id: str
    slug: str
    title: str
    category: ServiceCategory
    short_description: str
    technologies_used: list[str]
    is_featured: bool


class ServiceDetail(ServiceSummary):
    full_content: str
    created_at: str
    updated_at: str


class MetricItem(StrictBase):
    key: str
    label: str
    value: str


class CaseStudySummary(StrictBase):
    id: str
    slug: str
    title: str
    client_industry: str
    service_category: CaseStudyCategory
    domains: list[ServiceCategory]
    headline_metrics: list[MetricItem]
    software_stack: list[str]
    cover_image_url: str | None


class CaseStudyDetail(CaseStudySummary):
    problem_statement: str
    solution_architecture: str
    metrics: list[MetricItem]
    hardware_specs: dict[str, str]
    created_at: str


class NetworkZone(StrictBase):
    id: str
    name: str
    vlan: int | None
    purpose: str
    egress: Literal["none", "restricted", "open"]


class NetworkLink(StrictBase):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)
    from_: str = Field(alias="from")
    to: str
    policy: str

    def model_dump(self, **kwargs: Any) -> dict[str, Any]:
        kwargs.setdefault("by_alias", True)
        return super().model_dump(**kwargs)


class BomItem(StrictBase):
    item: str
    quantity: int
    notes: str | None = None


class HardwareBlueprintOut(StrictBase):
    blueprint_code: str
    tier_name: str
    network_architecture: dict[str, Any]  # {zones, links} validated loosely; detail checked in tests
    hardware_bom: list[BomItem]
    recommended_software_integrations: list[str]
    base_estimated_cost: int


class OfficeParameters(StrictBase):
    workstations: int = Field(default=0, ge=0, le=500)
    floor_area_sqft: int = Field(default=0, ge=0, le=200000)
    require_server_rack: bool = False
    air_gapped_security: bool = False


class SoftwareParameters(StrictBase):
    user_roles_count: int = Field(default=0, ge=0, le=50)
    third_party_integrations: list[str] = Field(default_factory=list, max_length=10)


class EstimateRequest(StrictBase):
    selected_services: list[EstimatorService] = Field(min_length=1, max_length=6)
    office_parameters: OfficeParameters = Field(default_factory=OfficeParameters)
    software_parameters: SoftwareParameters = Field(default_factory=SoftwareParameters)


class EstimateBreakdown(StrictBase):
    software_development: Range | None = None
    hardware_and_networking: Range | None = None
    on_prem_ai_setup: Range | None = None


class EstimateResult(StrictBase):
    model_config = ConfigDict(extra="forbid")
    cost_range_usd: Range
    timeline_weeks: Range
    breakdown: dict[str, Any]
    recommended_blueprint: str | None
    ai_deployment_type: AiDeploymentType
    assumptions: list[str]
    pricing_version: str
