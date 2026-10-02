"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { parsePrompt } from "@/lib/api/endpoints";
import { ShieldCheck, Cloud, Ban } from "lucide-react";

const presets = [
  "Route VLAN 30 traffic through the firewall",
  "Store customer emails for marketing outreach",
  "john@example.com send the network diagram externally",
];

export function PromptParser(): React.JSX.Element {
  const [prompt, setPrompt] = useState(presets[0] as string);
  const m = useMutation({ mutationFn: parsePrompt });

  return (
    <div className="space-y-6">
      <div className="flat-card rounded-[20px] p-6">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          maxLength={500}
          rows={3}
          className="w-full rounded-[8px] border border-white/10 bg-surface-2 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-text-faint">{prompt.length}/500</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button key={p} onClick={() => setPrompt(p)} className="rounded-full border border-white/10 px-3 py-1.5 text-xs">
              {p.slice(0, 28)}…
            </button>
          ))}
        </div>
        <button
          onClick={() => m.mutate({ prompt })}
          disabled={m.isPending || prompt.trim().length < 3}
          className="mt-4 rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black disabled:opacity-50"
        >
          Analyze prompt
        </button>
      </div>
      {m.data && (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flat-card rounded-[20px] p-5">
            <h3 className="text-sm font-semibold">Tokens</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {m.data.tokens.map((t, i) => (
                <span key={i} className="rounded-[8px] bg-white/10 px-2 py-1 font-mono text-[11px]">{t.text} · {t.kind}</span>
              ))}
            </div>
            <h3 className="mt-4 text-sm font-semibold">Intent</h3>
            <p className="mt-1 text-sm text-text-muted">{m.data.intent.label} ({Math.round(m.data.intent.confidence * 100)}%)</p>
            <h3 className="mt-4 text-sm font-semibold">Entities</h3>
            <ul className="mt-1 space-y-1 text-sm text-text-muted">
              {m.data.entities.map((e, i) => (
                <li key={i}>{e.text} · {e.type}</li>
              ))}
            </ul>
          </div>
          <div className="flat-card rounded-[20px] p-5">
            <h3 className="text-sm font-semibold">Guardrails</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {m.data.guardrails.map((g) => (
                <li key={g.rule} className="flex gap-2">
                  <span className={g.passed ? "text-emerald" : "text-rose"}>{g.passed ? "✓" : "✕"}</span>
                  <span>{g.rule} — {g.note}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-[12px] border border-white/10 p-4">
              {m.data.routing.target === "local_air_gapped_model" ? <ShieldCheck className="text-cyan" /> : m.data.routing.target === "cloud_model" ? <Cloud className="text-cyan" /> : <Ban className="text-rose" />}
              <p className="mt-2 font-medium">
                {m.data.routing.target === "local_air_gapped_model" ? "Local air-gapped model" : m.data.routing.target === "cloud_model" ? "Cloud model" : "Blocked"}
              </p>
              <p className="mt-1 text-sm text-text-muted">{m.data.routing.reason}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
