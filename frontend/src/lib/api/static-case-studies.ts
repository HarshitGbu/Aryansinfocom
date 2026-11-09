// Baked-in fallback for case studies, captured verbatim from the live API
// (GET /api/v1/case-studies and /api/v1/case-studies/{slug} on 2026-11-09).
// Used ONLY when the API is unreachable at the network level (e.g. the Vercel
// deployment has no backend host). If the API answers, its response wins.
// Do not edit content here by hand; re-capture from the backend instead.

import type { CaseStudy, CaseStudyFilter, CaseStudySummary } from "@/lib/api/types";

/**
 * Full detail objects in the same order the backend list returns them
 * (`ORDER BY sort_order ASC, created_at DESC`). Summaries are derived from
 * these via `toSummary` below.
 */
export const STATIC_CASE_STUDIES: CaseStudy[] = [
  {
    id: "caf0dc10-b16c-471e-b434-505c4ac794cd",
    slug: "logistics-dispatch-erp",
    title: "Regional logistics operator replaces spreadsheet dispatch",
    client_industry: "Logistics",
    service_category: "software",
    domains: ["web", "erp"],
    headline_metrics: [
      { key: "dispatch_errors_down", label: "Dispatch errors down", value: "38%" },
      { key: "manual_entry_hours_saved", label: "Manual entry hours saved", value: "12h/week" },
    ],
    software_stack: ["Python", "Postgres", "React"],
    cover_image_url: null,
    problem_statement: "Dispatch ran on spreadsheets with daily errors and no audit trail.",
    solution_architecture:
      "## Overview\n\nCustom ERP module with orders, routes and billing. Postgres backend with role-based access.",
    metrics: [
      { key: "dispatch_errors_down", label: "Dispatch errors down", value: "38%" },
      { key: "manual_entry_hours_saved", label: "Manual entry hours saved", value: "12h/week" },
    ],
    hardware_specs: {},
    created_at: "2026-10-02T06:23:48.179415+00:00",
  },
  {
    id: "1d3f6f8e-7a4c-4d02-a818-accd68b27438",
    slug: "clinic-appointments-portal",
    title: "Clinic group launches appointment portal",
    client_industry: "Healthcare",
    service_category: "software",
    domains: ["web", "ai"],
    headline_metrics: [
      { key: "no_shows_down", label: "No shows down", value: "22%" },
      { key: "booking_time_saved", label: "Booking time saved", value: "5 min/visit" },
    ],
    software_stack: ["TypeScript", "Postgres"],
    cover_image_url: null,
    problem_statement: "Phone-only booking caused long waits and missed slots.",
    solution_architecture: "## Overview\n\nPatient portal with reminders and a search over doctor notes.",
    metrics: [
      { key: "no_shows_down", label: "No shows down", value: "22%" },
      { key: "booking_time_saved", label: "Booking time saved", value: "5 min/visit" },
    ],
    hardware_specs: {},
    created_at: "2026-10-02T06:23:48.179415+00:00",
  },
  {
    id: "e2145ca4-0c6c-4291-9178-7f24b1360558",
    slug: "office-network-25-seats",
    title: "Growing office wired for 25 seats",
    client_industry: "Professional services",
    service_category: "hardware",
    domains: ["infrastructure"],
    headline_metrics: [
      { key: "mean_setup_time", label: "Mean setup time", value: "2 days" },
      { key: "wifi_outages_down", label: "Wifi outages down", value: "90%" },
    ],
    software_stack: [],
    cover_image_url: null,
    problem_statement: "Consumer routers and loose cabling caused weekly outages.",
    solution_architecture:
      "## Overview\n\nStructured cabling, managed switches and enterprise Wi-Fi with a small server rack.",
    metrics: [
      { key: "mean_setup_time", label: "Mean setup time", value: "2 days" },
      { key: "wifi_outages_down", label: "Wifi outages down", value: "90%" },
    ],
    hardware_specs: { switches: "2x 24-port", access_points: "4" },
    created_at: "2026-10-02T06:23:48.179415+00:00",
  },
  {
    id: "4ba3ebd8-fbe4-4762-9a99-da418190018c",
    slug: "airgapped-gpu-lab",
    title: "Research lab adds air-gapped GPU node",
    client_industry: "Research",
    service_category: "hardware",
    domains: ["infrastructure", "ai"],
    headline_metrics: [
      { key: "data_egress_events", label: "Data egress events", value: "0" },
      { key: "inference_latency_p95", label: "Inference latency p95", value: "1.2s" },
    ],
    software_stack: ["Inference gateway"],
    cover_image_url: null,
    problem_statement: "Sensitive data could not leave the building but local inference was needed.",
    solution_architecture:
      "## Overview\n\nAir-gapped inference node on VLAN 30 with no WAN egress and a management VLAN.",
    metrics: [
      { key: "data_egress_events", label: "Data egress events", value: "0" },
      { key: "inference_latency_p95", label: "Inference latency p95", value: "1.2s" },
    ],
    hardware_specs: { firewall: "1x perimeter", gpu_node: "1x inference server" },
    created_at: "2026-10-02T06:23:48.179415+00:00",
  },
  {
    id: "928d0eec-b6f2-4d23-9dff-810355ea4fa0",
    slug: "retail-erp-plus-wifi",
    title: "Retail chain links ERP with store networks",
    client_industry: "Retail",
    service_category: "hybrid",
    domains: ["erp", "infrastructure"],
    headline_metrics: [
      { key: "stock_accuracy", label: "Stock accuracy", value: "97%" },
      { key: "sync_failures_down", label: "Sync failures down", value: "60%" },
    ],
    software_stack: ["Python", "Postgres"],
    cover_image_url: null,
    problem_statement: "Stores had separate stock counts and unstable links.",
    solution_architecture: "## Overview\n\nCentral ERP with store LAN refresh and nightly sync.",
    metrics: [
      { key: "stock_accuracy", label: "Stock accuracy", value: "97%" },
      { key: "sync_failures_down", label: "Sync failures down", value: "60%" },
    ],
    hardware_specs: { switches: "1 per store" },
    created_at: "2026-10-02T06:23:48.179415+00:00",
  },
  {
    id: "94a9baa0-a7e0-4405-a346-8c4cb043c2f7",
    slug: "support-assistant-rag",
    title: "Support team pilots grounded answer assistant",
    client_industry: "SaaS",
    service_category: "hybrid",
    domains: ["ai", "web"],
    headline_metrics: [
      { key: "citation_coverage", label: "Citation coverage", value: "92%" },
      { key: "median_handle_time_down", label: "Median handle time down", value: "18%" },
    ],
    software_stack: ["pgvector", "Python"],
    cover_image_url: null,
    problem_statement: "Agents searched four tools for every ticket.",
    solution_architecture: "## Overview\n\nRAG over runbooks with cited answers and a review queue.",
    metrics: [
      { key: "citation_coverage", label: "Citation coverage", value: "92%" },
      { key: "median_handle_time_down", label: "Median handle time down", value: "18%" },
    ],
    hardware_specs: {},
    created_at: "2026-10-02T06:23:48.179415+00:00",
  },
];

/** Same field subset + `headline_metrics = metrics[:2]` rule as the backend's `_summary`. */
function toSummary(cs: CaseStudy): CaseStudySummary {
  return {
    id: cs.id,
    slug: cs.slug,
    title: cs.title,
    client_industry: cs.client_industry,
    service_category: cs.service_category,
    domains: cs.domains,
    headline_metrics: cs.metrics.slice(0, 2),
    software_stack: cs.software_stack,
    cover_image_url: cs.cover_image_url,
  };
}

/**
 * Mirrors `GET /case-studies` in Backend/app/api/v1/case_studies.py:
 * - `all`    → no filter
 * - web/erp/ai → keep rows whose `domains` array contains the value
 * - hardware/hybrid → keep rows whose `service_category` equals the value
 * - defaults: filter "all", limit 12, offset 0; total counts the filtered set
 *   before paging; page = filtered[offset : offset + limit].
 */
export function staticCaseStudyList(params?: {
  filter?: CaseStudyFilter;
  limit?: number;
  offset?: number;
}): { case_studies: CaseStudySummary[]; total: number } {
  const filter = params?.filter ?? "all";
  const limit = params?.limit ?? 12;
  const offset = params?.offset ?? 0;
  let rows = [...STATIC_CASE_STUDIES];
  if (filter === "web" || filter === "erp" || filter === "ai") {
    rows = rows.filter((r) => r.domains.includes(filter));
  } else if (filter === "hardware" || filter === "hybrid") {
    rows = rows.filter((r) => r.service_category === filter);
  }
  const total = rows.length;
  const page = rows.slice(offset, offset + limit);
  return { case_studies: page.map(toSummary), total };
}

/** Mirrors `GET /case-studies/{slug}`; returns undefined for an unknown slug. */
export function findStaticCaseStudy(slug: string): CaseStudy | undefined {
  return STATIC_CASE_STUDIES.find((c) => c.slug === slug);
}
