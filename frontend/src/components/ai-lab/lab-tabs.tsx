"use client";

import { Suspense, useEffect, useState } from "react";
import dynamic from "next/dynamic";

const Rag = dynamic(() => import("@/components/ai-lab/rag-simulator").then((m) => m.RagSimulator), { ssr: false });
const Parser = dynamic(() => import("@/components/ai-lab/prompt-parser").then((m) => m.PromptParser), { ssr: false });
const Diagram = dynamic(() => import("@/components/ai-lab/airgap-diagram").then((m) => m.AirgapDiagram), { ssr: false });

const tabs = [
  { id: "rag", label: "RAG simulator" },
  { id: "parser", label: "Prompt parser" },
  { id: "airgap", label: "Air-gapped architecture" },
] as const;

export function LabTabs(): React.JSX.Element {
  const [tab, setTab] = useState<string>("rag");

  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (["rag", "parser", "airgap"].includes(h)) setTab(h);
  }, []);

  function select(id: string): void {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  return (
    <div>
      <div role="tablist" aria-label="AI Lab tools" className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => select(t.id)}
            className={`rounded-full border px-4 py-2 text-sm min-h-[44px] ${tab === t.id ? "bg-white/10 text-white border-white/20" : "border-white/10 text-text-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="mt-8">
        <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
          {tab === "rag" && <Rag />}
          {tab === "parser" && <Parser />}
          {tab === "airgap" && <Diagram />}
        </Suspense>
      </div>
    </div>
  );
}
