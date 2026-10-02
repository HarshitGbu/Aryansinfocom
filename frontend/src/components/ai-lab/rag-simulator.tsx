"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { runRag } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";

const prefill = "How does local air-gapped AI routing work with our hardware firewall?";

export function RagSimulator(): React.JSX.Element {
  const [query, setQuery] = useState(prefill);
  const [topK, setTopK] = useState(2);
  const [elapsed, setElapsed] = useState<number[]>([]);

  const m = useMutation({
    mutationFn: runRag,
    onSuccess: (data) => {
      const total = data.pipeline.reduce((a, p) => a + p.duration_ms, 0) || 1;
      const scaled = data.pipeline.map((p) =>
        Math.min(700, Math.max(250, (p.duration_ms / total) * 3000 * (p.duration_ms / total + 0.2))),
      );
      setElapsed(scaled);
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="flat-card rounded-[20px] p-6">
        <h3 className="font-medium">
          Ask the demo knowledge base{" "}
          {m.data && (
            <span className={`ml-2 rounded px-2 py-0.5 font-mono text-[10px] ${m.data.mode === "live" ? "bg-emerald/10 text-emerald" : m.data.mode === "cached" ? "bg-cyan/10 text-cyan" : "bg-amber/10 text-amber"}`}>
              {m.data.mode === "fallback" ? "Demo mode" : m.data.mode}
            </span>
          )}
        </h3>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          maxLength={300}
          rows={3}
          className="mt-3 w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-text-faint">{query.length}/300</p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <span>Results to retrieve:</span>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => setTopK(n)}
              aria-pressed={topK === n}
              className={`h-9 w-9 rounded-full border text-sm ${topK === n ? "bg-white/10 border-white" : "border-white/10"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <button
          onClick={() => m.mutate({ query: query.trim(), top_k: topK })}
          disabled={m.isPending || query.trim().length < 3}
          className="mt-4 rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          {m.isPending ? "Running…" : "Run simulation"}
        </button>
        {m.isError && (
          <p className="mt-3 text-sm text-rose">
            {(m.error as ApiError).code === "rate_limited"
              ? `You've run a lot of demos. Try again in ${(m.error as ApiError).retryAfterSeconds ?? 60} seconds.`
              : "The demo is unavailable right now. Try again shortly."}
          </p>
        )}
      </div>
      <div className="flat-card rounded-[20px] p-6">
        <h3 className="font-mono text-xs uppercase text-text-faint">Pipeline</h3>
        {m.data ? (
          <ul className="mt-3 space-y-2 text-sm">
            {m.data.pipeline.map((p, i) => (
              <li key={p.stage} className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-emerald">● {p.stage}</span>
                <span className="font-mono text-xs text-text-muted">{Math.round(elapsed[i] ?? p.duration_ms)} ms</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-text-faint">Run the simulation to see stages.</p>
        )}
        {m.data && (
          <div className="mt-4 space-y-2">
            {m.data.retrieved_chunks.map((c) => (
              <div key={c.source} className="rounded-[12px] border border-white/10 p-3">
                <p className="font-mono text-[11px] text-cyan">{c.source}</p>
                <div className="mt-1 h-1 rounded bg-white/10">
                  <div className="h-full rounded bg-cyan" style={{ width: `${Math.round(c.score * 100)}%` }} />
                </div>
                <p className="mt-2 text-xs text-text-muted">{c.chunk}</p>
              </div>
            ))}
            <p className="rounded-[12px] bg-white/[0.04] p-3 text-sm">{m.data.llm_response}</p>
          </div>
        )}
      </div>
    </div>
  );
}
