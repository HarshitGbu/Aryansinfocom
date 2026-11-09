const COVERS: Record<string, string> = {
  "logistics-dispatch-erp": "/images/work/logistics-dispatch-erp.jpg",
  "clinic-appointments-portal": "/images/work/clinic-appointments-portal.jpg",
  "office-network-25-seats": "/images/work/office-network-25-seats.jpg",
  "airgapped-gpu-lab": "/images/work/airgapped-gpu-lab.jpg",
  "retail-erp-plus-wifi": "/images/work/retail-erp-plus-wifi.jpg",
  "support-assistant-rag": "/images/work/support-assistant-rag.jpg",
};

export function workCover(slug: string): string | null {
  return COVERS[slug] ?? null;
}
