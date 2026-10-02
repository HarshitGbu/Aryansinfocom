export interface ProcessStep {
  title: string;
  text: string;
}

export const deliverySteps: ProcessStep[] = [
  { title: "Discover", text: "Goals, constraints, and site survey in one structured intake." },
  { title: "Design", text: "Architecture, network plan, and fixed planning range before build." },
  { title: "Build and install", text: "Software sprints plus on-site hardware installation by one team." },
  { title: "Support", text: "Monitoring, updates, and on-call response after handover." },
];

export const aboutProcess: ProcessStep[] = [
  { title: "Discover", text: "Stakeholder interviews and technical audit of existing systems." },
  { title: "Architect", text: "Blueprint covering software, network zones, and AI deployment." },
  { title: "Build", text: "Iterative delivery with demo checkpoints every two weeks." },
  { title: "Install on site", text: "Cabling, racks, and workstations commissioned in person." },
  { title: "Operate", text: "Runbooks, training, and ongoing maintenance together." },
];

export const securityCommitments: string[] = [
  // PLACEHOLDER — confirm with agency before launch.
  "Least-privilege access on every system we ship.",
  // PLACEHOLDER
  "Encrypted backups with tested restores.",
  // PLACEHOLDER
  "Air-gap option for sensitive AI workloads.",
  // PLACEHOLDER
  "Documented handover with credentials rotated.",
  // PLACEHOLDER
  "Incident response within one business day.",
];
