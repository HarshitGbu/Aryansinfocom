export type TechGroup =
  | "Frontend"
  | "Backend"
  | "AI"
  | "Infrastructure"
  | "Cloud";

export interface TechItem {
  name: string;
  role: string;
  group: TechGroup;
}

export const techGroups: Array<"All" | TechGroup> = [
  "All",
  "Frontend",
  "Backend",
  "AI",
  "Infrastructure",
  "Cloud",
];

export const techStack: TechItem[] = [
  { name: "Next.js", role: "Framework", group: "Frontend" },
  { name: "React", role: "UI", group: "Frontend" },
  { name: "TypeScript", role: "Language", group: "Frontend" },
  { name: "Tailwind", role: "Styling", group: "Frontend" },
  { name: "Python", role: "Language", group: "Backend" },
  { name: "FastAPI", role: "API", group: "Backend" },
  { name: "Node.js", role: "Runtime", group: "Backend" },
  { name: "PostgreSQL", role: "Database", group: "Backend" },
  { name: "Redis", role: "Cache", group: "Backend" },
  { name: "PyTorch", role: "Training", group: "AI" },
  { name: "vLLM", role: "Serving", group: "AI" },
  { name: "pgvector", role: "Search", group: "AI" },
  { name: "RAG pipelines", role: "Retrieval", group: "AI" },
  { name: "Cisco", role: "Networking", group: "Infrastructure" },
  { name: "Ubiquiti", role: "Wi-Fi", group: "Infrastructure" },
  { name: "Structured cabling", role: "Cabling", group: "Infrastructure" },
  { name: "GPU racks", role: "Compute", group: "Infrastructure" },
  { name: "AWS", role: "Cloud", group: "Cloud" },
  { name: "Cloudflare", role: "Edge", group: "Cloud" },
  { name: "Docker", role: "Containers", group: "Cloud" },
  { name: "Linux", role: "OS", group: "Cloud" },
];
