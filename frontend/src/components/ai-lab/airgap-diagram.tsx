"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getBlueprint } from "@/lib/api/endpoints";
import { cn } from "@/lib/cn";

const positions: Record<string, { x: number; y: number }> = {
  wan: { x: 20, y: 10 },
  fw: { x: 70, y: 10 },
  office: { x: 20, y: 50 },
  servers: { x: 70, y: 50 },
  ai: { x: 20, y: 85 },
  mgmt: { x: 70, y: 85 },
};

export function AirgapDiagram(): React.JSX.Element {
  const [selected, setSelected] = useState("ai");
  const q = useQuery({
    queryKey: ["blueprint"],
    queryFn: () => getBlueprint("BLUEPRINT-AIRGAP-25"),
    retry: false,
  });

  if (q.isPending) return <p className="text-sm text-text-muted">Loading blueprint…</p>;
  if (q.isError || !q.data) return <p className="text-sm text-text-muted">Couldn&apos;t load blueprint.</p>;

  const bp = q.data;
  const activeLinks = bp.network_architecture.links.filter((l) => l.from === selected || l.to === selected);

  return (
    <div>
      <div className="relative grid gap-3 md:grid-cols-2">
        {bp.network_architecture.zones.map((z) => (
          <button
            key={z.id}
            onClick={() => setSelected(z.id)}
            aria-pressed={selected === z.id}
            className={cn(
              "flat-card rounded-[20px] p-4 text-left",
              selected === z.id ? "border-accent" : "",
              z.id === "ai" ? "border-accent/50" : "",
            )}
          >
            <p className="font-medium">{z.name}</p>
            {z.vlan !== null && <p className="mt-1 font-mono text-[11px] text-cyan">VLAN {z.vlan}</p>}
            <p className="mt-1 text-xs text-text-muted">{z.purpose}</p>
            <span
              className={cn(
                "mt-2 inline-block rounded px-2 py-0.5 font-mono text-[10px]",
                z.egress === "none" ? "bg-rose/10 text-rose" : z.egress === "restricted" ? "bg-amber/10 text-amber" : "bg-emerald/10 text-emerald",
              )}
            >
              {z.egress === "none" ? "No outbound" : z.egress}
            </span>
          </button>
        ))}
      </div>
      <svg aria-hidden viewBox="0 0 100 100" className="mt-4 h-24 w-full opacity-40">
        {bp.network_architecture.links.map((l, i) => {
          const a = positions[l.from];
          const b = positions[l.to];
          if (!a || !b) return null;
          const active = l.from === selected || l.to === selected;
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={active ? "#6366f1" : "#444"} strokeWidth={active ? 1.5 : 0.7} />;
        })}
      </svg>
      <div className="flat-card mt-2 rounded-[20px] p-4" aria-live="polite">
        <h3 className="text-sm font-semibold">Policies touching {selected}</h3>
        <ul className="mt-2 space-y-1 text-sm text-text-muted">
          {activeLinks.map((l, i) => (
            <li key={i}>{l.from} → {l.to}: {l.policy}</li>
          ))}
        </ul>
      </div>
      <details className="flat-card mt-4 rounded-[20px] p-4">
        <summary className="cursor-pointer text-sm font-medium">BOM</summary>
        <ul className="mt-3 space-y-2 text-sm text-text-muted">
          {bp.hardware_bom.map((b, i) => (
            <li key={i}>{b.item} × {b.quantity}{b.notes ? ` — ${b.notes}` : ""}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
