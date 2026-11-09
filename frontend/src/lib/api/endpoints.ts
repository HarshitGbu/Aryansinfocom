import { ApiError, request, isMockingEnabled } from "@/lib/api/client";
import * as mocks from "@/lib/api/mocks";
import { findStaticCaseStudy, staticCaseStudyList } from "@/lib/api/static-case-studies";
import type {
  CaseStudyFilter,
  ContactRequest,
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
  CaseStudy,
  CaseStudySummary,
  Service,
  ServiceCategory,
  ServiceSummary,
} from "@/lib/api/types";

export async function getServices(category?: ServiceCategory): Promise<ServiceSummary[]> {
  if (isMockingEnabled()) return mocks.mockServices(category);
  const q = category ? `?category=${category}` : "";
  const data = await request<{ success: true; services: ServiceSummary[] }>(
    `/services${q}`,
    { method: "GET", revalidate: 60 },
  );
  return data.services;
}

export async function getService(slug: string): Promise<Service> {
  if (isMockingEnabled()) return mocks.mockService(slug);
  const data = await request<{ success: true; service: Service }>(
    `/services/${slug}`,
    { method: "GET", revalidate: 60 },
  );
  return data.service;
}

/**
 * True only when the API could not be reached at all: `request()` maps every
 * fetch-level failure (DNS/connection refused/abort) and the 10s timeout to an
 * `ApiError` with `status: 0`. A live API always answers with a real HTTP
 * status, so 4xx/5xx from a reachable backend never falls back to static data.
 */
function isUnreachable(e: unknown): boolean {
  return e instanceof ApiError && e.status === 0;
}

export async function getCaseStudies(params?: {
  filter?: CaseStudyFilter;
  limit?: number;
  offset?: number;
}): Promise<{ case_studies: CaseStudySummary[]; total: number }> {
  if (isMockingEnabled()) return mocks.mockCaseStudies(params?.filter ?? "all", params?.limit ?? 12);
  const search = new URLSearchParams();
  if (params?.filter) search.set("filter", params.filter);
  if (params?.limit !== undefined) search.set("limit", String(params.limit));
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  const q = search.toString() ? `?${search.toString()}` : "";
  try {
    return await request<{ success: true; case_studies: CaseStudySummary[]; total: number }>(
      `/case-studies${q}`,
      { method: "GET", revalidate: 60 },
    );
  } catch (e) {
    if (!isUnreachable(e)) throw e;
    return staticCaseStudyList(params);
  }
}

export async function getCaseStudy(slug: string): Promise<CaseStudy> {
  if (isMockingEnabled()) return mocks.mockCaseStudy(slug);
  let data: { success: true; case_study: CaseStudy };
  try {
    data = await request<{ success: true; case_study: CaseStudy }>(
      `/case-studies/${slug}`,
      { method: "GET", revalidate: 60 },
    );
  } catch (e) {
    if (!isUnreachable(e)) throw e;
    const fallback = findStaticCaseStudy(slug);
    if (fallback) return fallback;
    // Unknown slug: mirror the live API's 404 so page.tsx renders notFound().
    throw new ApiError({
      status: 404,
      code: "not_found",
      message: `Case study not found: ${slug}`,
    });
  }
  return data.case_study;
}

export async function getBlueprint(code: string): Promise<HardwareBlueprint> {
  if (isMockingEnabled()) return mocks.mockBlueprint(code);
  const data = await request<{ success: true; blueprint: HardwareBlueprint }>(
    `/hardware-blueprints/${code}`,
    { method: "GET", revalidate: 60 },
  );
  return data.blueprint;
}

export async function calculateEstimate(body: EstimateRequest): Promise<EstimateResult> {
  if (isMockingEnabled()) return mocks.mockCalculate(body);
  const data = await request<{ success: true; estimate: EstimateResult }>(
    "/estimate/calculate",
    { method: "POST", body: JSON.stringify(body) },
  );
  return data.estimate;
}

export async function submitEstimate(body: LeadSubmitRequest): Promise<{
  lead_id: string;
  status: LeadStatus;
  estimate: EstimateResult;
  booking_url: string | null;
}> {
  if (isMockingEnabled()) return mocks.mockSubmit(body);
  return request<{
    success: true;
    lead_id: string;
    status: LeadStatus;
    estimate: EstimateResult;
    booking_url: string | null;
  }>("/estimate/submit", { method: "POST", body: JSON.stringify(body) });
}

export async function submitContact(body: ContactRequest): Promise<{ submission_id: string }> {
  if (isMockingEnabled()) return mocks.mockContact();
  return request<{ success: true; submission_id: string }>("/contact", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function runRag(body: RagRequest): Promise<RagResponse> {
  if (isMockingEnabled()) return mocks.mockRag(body);
  return request<RagResponse>("/playground/rag-simulation", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function parsePrompt(body: PromptParseRequest): Promise<PromptParseResponse> {
  if (isMockingEnabled()) return mocks.mockParse(body);
  return request<PromptParseResponse>("/playground/prompt-parse", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function search(q: string): Promise<{ results: SearchResult[] }> {
  if (isMockingEnabled()) return mocks.mockSearch(q);
  return request<{ success: true; results: SearchResult[] }>(
    `/search?q=${encodeURIComponent(q)}&limit=8`,
    { method: "GET" },
  );
}
