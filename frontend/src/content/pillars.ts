import type { ServiceCategory } from "@/lib/api/types";
import { Code2, Layers, FlaskConical, Server, Network } from "lucide-react";

export interface Pillar {
  key: string;
  icon: typeof Code2;
  title: string;
  description: string;
  href: string;
  category: ServiceCategory | "synergy";
  capabilities: string[];
}

// Descriptions verbatim from §11.2 messaging matrix.
export const pillars: Pillar[] = [
  {
    key: "web",
    icon: Code2,
    title: "Custom web apps",
    description: "Bespoke, scalable web apps and microservices built with modern frameworks.",
    href: "/services/web-apps",
    category: "web",
    capabilities: [
      "Bespoke web platforms and portals",
      "API design and microservices",
      "Auth, roles, and audit trails",
      "Cloud deployment and CI/CD",
    ],
  },
  {
    key: "erp",
    icon: Layers,
    title: "Enterprise ERP systems",
    description: "Modular business management platforms replacing legacy bottlenecks.",
    href: "/services/erp-systems",
    category: "erp",
    capabilities: [
      "Finance and inventory modules",
      "CRM, HR, and order management",
      "Legacy migration without downtime",
      "Reports and operational dashboards",
    ],
  },
  {
    key: "ai",
    icon: FlaskConical,
    title: "AI tools and integration",
    description: "Domain-specific LLMs, agentic workflows, and automated pipeline integration.",
    href: "/services/ai-solutions",
    category: "ai",
    capabilities: [
      "Local and cloud LLM deployment",
      "RAG over internal documents",
      "Agentic workflow automation",
      "Evaluation and guardrails",
    ],
  },
  {
    key: "infra",
    icon: Server,
    title: "Hardware and infrastructure",
    description:
      "Enterprise network cabling, zero-downtime Wi-Fi, workstation setup, and local GPU server racks.",
    href: "/services/infrastructure",
    category: "infrastructure",
    capabilities: [
      "Structured cabling and Wi-Fi",
      "On-site workstation provisioning",
      "Local GPU racks and servers",
      "Air-gapped secure networks",
    ],
  },
  {
    key: "synergy",
    icon: Network,
    title: "One team, cable to code",
    description:
      "Software engineering and physical infrastructure under one roof, eliminating vendor friction.",
    href: "#synergy",
    category: "synergy",
    capabilities: [],
  },
];

export const estimatorServiceMeta: Record<
  string,
  { label: string; category: ServiceCategory }
> = {
  custom_web: { label: "Custom web app", category: "web" },
  erp_custom: { label: "Custom ERP", category: "erp" },
  ai_solutions: { label: "AI tools and integration", category: "ai" },
  office_networking: { label: "Office networking and cabling", category: "infrastructure" },
  local_ai_server: { label: "Local AI server", category: "infrastructure" },
  workstation_provisioning: { label: "Workstation setup", category: "infrastructure" },
};
