// Appendix A.3 — copied verbatim. This file is law. Do not edit field names.
// If you believe the contract is wrong, log in PROGRESS.md and keep going.

export type ServiceCategory = "web" | "erp" | "ai" | "infrastructure";
export type CaseStudyCategory = "software" | "hardware" | "hybrid";
export type CaseStudyFilter =
  | "all"
  | "web"
  | "erp"
  | "ai"
  | "hardware"
  | "hybrid";
export type EstimatorService =
  | "custom_web"
  | "erp_custom"
  | "ai_solutions"
  | "office_networking"
  | "local_ai_server"
  | "workstation_provisioning";
export type AiDeploymentType =
  | "cloud"
  | "on_premise_airgapped"
  | "hybrid"
  | "none";
export type LeadStatus = "new" | "contacted" | "discovery_booked" | "closed";

export interface ServiceSummary {
  id: string;
  slug: string;
  title: string;
  category: ServiceCategory;
  short_description: string;
  technologies_used: string[];
  is_featured: boolean;
}

export interface Service extends ServiceSummary {
  full_content: string;
  created_at: string;
  updated_at: string;
}

export interface MetricItem {
  key: string;
  label: string;
  value: string;
}

export interface CaseStudySummary {
  id: string;
  slug: string;
  title: string;
  client_industry: string;
  service_category: CaseStudyCategory;
  domains: ServiceCategory[];
  headline_metrics: MetricItem[];
  software_stack: string[];
  cover_image_url: string | null;
}

export interface CaseStudy extends CaseStudySummary {
  problem_statement: string;
  solution_architecture: string;
  metrics: MetricItem[];
  hardware_specs: Record<string, string>;
  created_at: string;
}

export interface NetworkZone {
  id: string;
  name: string;
  vlan: number | null;
  purpose: string;
  egress: "none" | "restricted" | "open";
}

export interface NetworkLink {
  from: string;
  to: string;
  policy: string;
}

export interface BomItem {
  item: string;
  quantity: number;
  notes?: string;
}

export interface HardwareBlueprint {
  blueprint_code: string;
  tier_name: string;
  network_architecture: { zones: NetworkZone[]; links: NetworkLink[] };
  hardware_bom: BomItem[];
  recommended_software_integrations: string[];
  base_estimated_cost: number;
}

export interface Range {
  min: number;
  max: number;
}

export interface EstimateRequest {
  selected_services: EstimatorService[];
  office_parameters?: {
    workstations: number;
    floor_area_sqft: number;
    require_server_rack: boolean;
    air_gapped_security: boolean;
  };
  software_parameters?: {
    user_roles_count: number;
    third_party_integrations: string[];
  };
}

export interface EstimateResult {
  cost_range_usd: Range;
  timeline_weeks: Range;
  breakdown: {
    software_development?: Range;
    hardware_and_networking?: Range;
    on_prem_ai_setup?: Range;
  };
  recommended_blueprint: string | null;
  ai_deployment_type: AiDeploymentType;
  assumptions: string[];
  pricing_version: string;
}

export interface LeadSubmitRequest {
  client_name: string;
  client_email: string;
  company_name?: string;
  phone_number?: string;
  notes?: string;
  estimate_input: EstimateRequest;
  consent: true;
  website?: string;
}

export interface ContactRequest {
  name: string;
  email: string;
  company?: string;
  topic?: "software" | "erp" | "ai" | "infrastructure" | "other";
  message: string;
  consent: true;
  website?: string;
}

export interface RagRequest {
  query: string;
  top_k?: number;
}

export interface RagChunk {
  source: string;
  score: number;
  chunk: string;
}

export interface PipelineStage {
  stage:
    | "embed_query"
    | "vector_search"
    | "rerank"
    | "prompt_assembly"
    | "generation";
  duration_ms: number;
  detail: string;
}

export interface RagResponse {
  success: true;
  retrieved_chunks: RagChunk[];
  llm_response: string;
  pipeline: PipelineStage[];
  total_ms: number;
  mode: "live" | "cached" | "fallback";
}

export interface PromptParseRequest {
  prompt: string;
}

export interface PromptParseResponse {
  success: true;
  tokens: Array<{
    text: string;
    kind: "word" | "number" | "symbol" | "entity" | "keyword";
  }>;
  intent: { label: string; confidence: number };
  entities: Array<{
    text: string;
    type: "hardware" | "network" | "software" | "compliance" | "quantity";
  }>;
  guardrails: Array<{ rule: string; passed: boolean; note: string }>;
  routing: {
    target: "local_air_gapped_model" | "cloud_model" | "blocked";
    reason: string;
  };
}

export interface SearchResult {
  type: "service" | "case_study" | "page" | "action";
  title: string;
  subtitle: string | null;
  href: string;
}

// Envelope helpers
export interface ApiSuccess {
  success: true;
}

export type ApiEnvelope<T> = ({ success: true } & T) | ApiErrorEnvelope;

export interface ApiErrorEnvelope {
  success: false;
  error: { code: string; message: string; details?: Record<string, unknown> };
}

export type ErrorCode =
  | "validation_error"
  | "not_found"
  | "rate_limited"
  | "unauthorized"
  | "payload_too_large"
  | "ai_unavailable"
  | "internal_error";
