"use client";

import { Suspense, useEffect, useRef, useState } from "react";
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
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const h = window.location.hash.replace("#", "");
    if (["rag", "parser", "airgap"].includes(h)) setTab(h);
  }, []);

  function select(id: string): void {
    setTab(id);
    window.history.replaceState(null, "", `#${id}`);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    const i = tabs.findIndex((t) => t.id === tab);
    let next: number;
    switch (e.key) {
      case "ArrowRight":
        next = (i + 1) % tabs.length;
        break;
      case "ArrowLeft":
        next = (i - 1 + tabs.length) % tabs.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = tabs.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const target = tabs[next];
    if (!target) return;
    select(target.id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div role="tablist" aria-label="AI Lab tools" onKeyDown={onKeyDown} className="flex flex-wrap gap-2">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            id={`tab-${t.id}`}
            role="tab"
            aria-selected={tab === t.id}
            aria-controls={`panel-${t.id}`}
            tabIndex={tab === t.id ? 0 : -1}
            onClick={() => select(t.id)}
            className={`rounded-full border px-4 py-2 text-sm min-h-[44px] ${tab === t.id ? "bg-white/10 text-white border-white/20" : "border-white/10 text-text-muted"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        tabIndex={0}
        className="mt-8 focus:outline-none"
      >
        <Suspense fallback={<p className="text-sm text-text-muted">Loading…</p>}>
          {tab === "rag" && <Rag />}
          {tab === "parser" && <Parser />}
          {tab === "airgap" && <Diagram />}
        </Suspense>
      </div>
    </div>
  );
}
