import type { CaseStudyFilter } from "@/lib/api/types";

export const caseStudyFilters: Array<{ label: string; value: CaseStudyFilter }> = [
  { label: "All", value: "all" },
  { label: "Web", value: "web" },
  { label: "ERP", value: "erp" },
  { label: "AI", value: "ai" },
  { label: "Hardware", value: "hardware" },
  { label: "Hybrid", value: "hybrid" },
];
