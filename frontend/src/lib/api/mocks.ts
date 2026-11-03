// Static fixtures matching Appendix A. Used only when NEXT_PUBLIC_API_MOCKING=enabled.
// Not business logic — never re-implement pricing here beyond the golden fixture.
import type {
  CaseStudy,
  CaseStudyFilter,
  CaseStudySummary,
  EstimateRequest,
  EstimateResult,
  HardwareBlueprint,
  LeadStatus,
  LeadSubmitRequest,
  PromptParseRequest,
  PromptParseResponse,
  RagRequest,
  RagResponse,
  SearchResult,
  Service,
  ServiceCategory,
  ServiceSummary,
} from "@/lib/api/types";
import { ApiError } from "@/lib/api/client";

const now = "2026-10-01T00:00:00Z";

const services: Service[] = [
  {
    id: "1", slug: "web-apps", title: "Custom web apps", category: "web",
    short_description: "Bespoke web platforms and portals.", technologies_used: ["Next.js", "TypeScript", "PostgreSQL"],
    is_featured: true, full_content: "## Overview\n\nBespoke web platforms.\n\n## Delivery\n\nSprints with demos.\n",
    created_at: now, updated_at: now,
  },
  {
    id: "2", slug: "erp-systems", title: "Enterprise ERP systems", category: "erp",
    short_description: "Modular ERP replacing legacy bottlenecks.", technologies_used: ["Python", "FastAPI", "PostgreSQL"],
    is_featured: true, full_content: "## Overview\n\nModular ERP.\n\n## Modules\n\nFinance, inventory, CRM.\n",
    created_at: now, updated_at: now,
  },
  {
    id: "3", slug: "ai-solutions", title: "AI tools and integration", category: "ai",
    short_description: "Local and cloud AI copilots.", technologies_used: ["PyTorch", "vLLM", "pgvector"],
    is_featured: true, full_content: "## Overview\n\nDomain copilots.\n\n## Safety\n\nGuardrails included.\n",
    created_at: now, updated_at: now,
  },
  {
    id: "4", slug: "infrastructure", title: "Turnkey office and hardware", category: "infrastructure",
    short_description: "Cabling, Wi-Fi, GPU racks.", technologies_used: ["Cisco", "Ubiquiti", "Linux"],
    is_featured: true, full_content: "## Overview\n\nOffice networks.\n\n## Scope\n\nCabling, Wi-Fi, racks.\n",
    created_at: now, updated_at: now,
  },
];

const cases: CaseStudy[] = [
  {
    id: "c1", slug: "retail-erp", title: "Retail ERP rollout", client_industry: "Retail",
    service_category: "software", domains: ["erp", "web"],
    headline_metrics: [{ key: "order_time", label: "Order time", value: "-38%" }, { key: "stockouts", label: "Stockouts", value: "-52%" }],
    software_stack: ["Next.js", "FastAPI", "PostgreSQL"], cover_image_url: null,
    problem_statement: "Legacy stock system slowed orders.",
    solution_architecture: "## Architecture\n\nModular ERP with synced inventory.\n",
    metrics: [{ key: "order_time", label: "Order time", value: "-38%" }, { key: "stockouts", label: "Stockouts", value: "-52%" }],
    hardware_specs: {}, created_at: now,
  },
  {
    id: "c2", slug: "clinic-network", title: "Clinic network refresh", client_industry: "Healthcare",
    service_category: "hardware", domains: ["infrastructure"],
    headline_metrics: [{ key: "downtime", label: "Downtime", value: "-90%" }, { key: "coverage", label: "Wi-Fi coverage", value: "100%" }],
    software_stack: [], cover_image_url: null,
    problem_statement: "Dead zones across two floors.",
    solution_architecture: "## Architecture\n\nStructured cabling plus managed Wi-Fi.\n",
    metrics: [{ key: "downtime", label: "Downtime", value: "-90%" }],
    hardware_specs: { Switches: "Managed PoE", Cabling: "Cat6A" }, created_at: now,
  },
  {
    id: "c3", slug: "factory-copilot", title: "Factory knowledge copilot", client_industry: "Manufacturing",
    service_category: "hybrid", domains: ["ai", "infrastructure"],
    headline_metrics: [{ key: "lookup_time", label: "Lookup time", value: "-70%" }, { key: "tickets", label: "Repeat tickets", value: "-31%" }],
    software_stack: ["vLLM", "pgvector"], cover_image_url: null,
    problem_statement: "Manuals scattered across drives.",
    solution_architecture: "## Architecture\n\nAir-gapped RAG over manuals.\n",
    metrics: [{ key: "lookup_time", label: "Lookup time", value: "-70%" }],
    hardware_specs: { GPU: "Local inference node", Network: "VLAN 30 isolated" }, created_at: now,
  },
  {
    id: "c4", slug: "saas-portal", title: "SaaS customer portal", client_industry: "SaaS",
    service_category: "software", domains: ["web"],
    headline_metrics: [{ key: "activation", label: "Activation", value: "+22%" }, { key: "churn", label: "Churn", value: "-14%" }],
    software_stack: ["Next.js", "Stripe"], cover_image_url: null,
    problem_statement: "Onboarding drop-off.",
    solution_architecture: "## Architecture\n\nPortal with metered billing.\n",
    metrics: [{ key: "activation", label: "Activation", value: "+22%" }],
    hardware_specs: {}, created_at: now,
  },
  {
    id: "c5", slug: "office-airgap", title: "Air-gapped design office", client_industry: "Engineering",
    service_category: "hardware", domains: ["infrastructure"],
    headline_metrics: [{ key: "egress", label: "Outbound", value: "Blocked" }, { key: "uptime", label: "Uptime", value: "99.9%" }],
    software_stack: [], cover_image_url: null,
    problem_statement: "IP must never leave the building.",
    solution_architecture: "## Architecture\n\nBLUEPRINT-AIRGAP-25 deployment.\n",
    metrics: [{ key: "egress", label: "Outbound", value: "Blocked" }],
    hardware_specs: { Firewall: "Perimeter + zone rules", VLANs: "10/20/30/99" }, created_at: now,
  },
  {
    id: "c6", slug: "support-agent", title: "Support triage agent", client_industry: "Logistics",
    service_category: "software", domains: ["ai", "web"],
    headline_metrics: [{ key: "triage_time", label: "Triage time", value: "-61%" }, { key: "csat", label: "CSAT", value: "+9 pts" }],
    software_stack: ["LangChain-style pipelines", "Redis"], cover_image_url: null,
    problem_statement: "Inbox overload.",
    solution_architecture: "## Architecture\n\nClassifier plus human review.\n",
    metrics: [{ key: "triage_time", label: "Triage time", value: "-61%" }],
    hardware_specs: {}, created_at: now,
  },
];

function toSummary(c: CaseStudy): CaseStudySummary {
  return {
    id: c.id, slug: c.slug, title: c.title, client_industry: c.client_industry,
    service_category: c.service_category, domains: c.domains,
    headline_metrics: c.headline_metrics, software_stack: c.software_stack,
    cover_image_url: c.cover_image_url,
  };
}

export function mockServices(category?: ServiceCategory): ServiceSummary[] {
  return services
    .filter((s) => (category ? s.category === category : true))
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    .map(({ full_content, created_at, updated_at, ...rest }) => rest);
}

export function mockService(slug: string): Service {
  const found = services.find((s) => s.slug === slug);
  if (!found) throw new ApiError({ status: 404, code: "not_found", message: "Not found" });
  return found;
}

export function mockCaseStudies(
  filter: CaseStudyFilter = "all",
  limit = 12,
): { case_studies: CaseStudySummary[]; total: number } {
  const filtered =
    filter === "all"
      ? cases
      : filter === "hardware" || filter === "hybrid"
        ? cases.filter((c) => c.service_category === filter)
        : cases.filter((c) => c.domains.includes(filter));
  return { case_studies: filtered.slice(0, limit).map(toSummary), total: filtered.length };
}

export function mockCaseStudy(slug: string): CaseStudy {
  const found = cases.find((c) => c.slug === slug);
  if (!found) throw new ApiError({ status: 404, code: "not_found", message: "Not found" });
  return found;
}

export function mockBlueprint(code: string): HardwareBlueprint {
  void code;
  return {
    blueprint_code: "BLUEPRINT-AIRGAP-25",
    tier_name: "25-seat air-gapped office",
    network_architecture: {
      zones: [
        { id: "wan", name: "Internet", vlan: null, purpose: "Upstream provider", egress: "open" },
        { id: "fw", name: "Perimeter firewall", vlan: null, purpose: "Policy enforcement", egress: "restricted" },
        { id: "office", name: "Office LAN", vlan: 10, purpose: "Workstations and printers", egress: "restricted" },
        { id: "servers", name: "Core services", vlan: 20, purpose: "Files, auth, backups", egress: "restricted" },
        { id: "ai", name: "AI inference", vlan: 30, purpose: "Local GPU workloads", egress: "none" },
        { id: "mgmt", name: "Management", vlan: 99, purpose: "Switch and firewall admin", egress: "none" },
      ],
      links: [
        { from: "wan", to: "fw", policy: "Allow established only" },
        { from: "fw", to: "office", policy: "Allow HTTP/S via proxy" },
        { from: "fw", to: "servers", policy: "Allow updates on schedule" },
        { from: "office", to: "servers", policy: "Allow SMB and auth" },
        { from: "servers", to: "ai", policy: "Allow job submit, deny egress" },
        { from: "mgmt", to: "fw", policy: "Allow SSH from mgmt only" },
        { from: "ai", to: "wan", policy: "DENY all outbound" },
      ],
    },
    hardware_bom: [
      { item: "Perimeter firewall", quantity: 1, notes: "HA pair optional" },
      { item: "PoE access switch", quantity: 2 },
      { item: "GPU inference node", quantity: 1, notes: "VLAN 30" },
      { item: "Cat6A drops", quantity: 30 },
    ],
    recommended_software_integrations: ["sso", "backups"],
    base_estimated_cost: 18000,
  };
}

export function mockCalculate(_body: EstimateRequest): EstimateResult {
  void _body;
  return {
    cost_range_usd: { min: 18500, max: 27000 },
    timeline_weeks: { min: 6, max: 10 },
    breakdown: {
      software_development: { min: 12000, max: 16000 },
      hardware_and_networking: { min: 4000, max: 6000 },
      on_prem_ai_setup: { min: 2500, max: 5000 },
    },
    recommended_blueprint: "BLUEPRINT-AIRGAP-25",
    ai_deployment_type: "on_premise_airgapped",
    assumptions: ["Planning rates, site survey pending.", "Hardware at list price."],
    pricing_version: "2026-10-v1",
  };
}

export function mockSubmit(body: LeadSubmitRequest): {
  lead_id: string;
  status: LeadStatus;
  estimate: EstimateResult;
  booking_url: string | null;
} {
  void body;
  return {
    lead_id: "00000000-0000-4000-8000-000000000000",
    status: "new",
    estimate: mockCalculate(body.estimate_input),
    booking_url: null,
  };
}

export function mockContact(): { submission_id: string } {
  return { submission_id: "00000000-0000-4000-8000-000000000001" };
}

export function mockRag(body: RagRequest): RagResponse {
  return {
    success: true,
    retrieved_chunks: [
      { source: "Network_Security_Spec.pdf", score: 0.91, chunk: "VLAN 30 carries AI inference with no outbound route." },
      { source: "Firewall_Rules.md", score: 0.84, chunk: "Default deny from AI zone to WAN; management via VLAN 99." },
    ].slice(0, body.top_k ?? 2),
    llm_response: "Local air-gapped routing keeps VLAN 30 isolated; the firewall denies AI to WAN egress.",
    pipeline: [
      { stage: "embed_query", duration_ms: 12, detail: "Embed query" },
      { stage: "vector_search", duration_ms: 8, detail: "Vector search" },
      { stage: "rerank", duration_ms: 1, detail: "Rerank" },
      { stage: "prompt_assembly", duration_ms: 1, detail: "Assemble prompt" },
      { stage: "generation", duration_ms: 420, detail: "Generate answer" },
    ],
    total_ms: 442,
    mode: "fallback",
  };
}

export function mockParse(_body: PromptParseRequest): PromptParseResponse {
  void _body;
  return {
    success: true,
    tokens: [
      { text: "Route", kind: "keyword" },
      { text: "VLAN", kind: "entity" },
      { text: "30", kind: "number" },
    ],
    intent: { label: "network_isolation", confidence: 0.82 },
    entities: [{ text: "VLAN 30", type: "network" }],
    guardrails: [
      { rule: "contains_sensitive_data", passed: true, note: "No secrets detected." },
      { rule: "prompt_injection_patterns", passed: true, note: "No injection." },
      { rule: "length_within_limit", passed: true, note: "Within 500 chars." },
      { rule: "topic_in_scope", passed: true, note: "Infrastructure topic." },
    ],
    routing: { target: "local_air_gapped_model", reason: "Sensitive network topic stays local." },
  };
}

export function mockSearch(_q: string): { results: SearchResult[] } {
  void _q;
  return {
    results: [
      { type: "page", title: "Estimator", subtitle: null, href: "/estimator" },
      { type: "service", title: "Custom web apps", subtitle: null, href: "/services/web-apps" },
    ],
  };
}
