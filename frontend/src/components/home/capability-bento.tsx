import Link from "next/link";
import { pillars } from "@/content/pillars";
import { SpotlightCard } from "@/components/ui/spotlight-card";

const spans: Record<string, string> = {
  web: "md:col-span-3",
  erp: "md:col-span-3",
  ai: "md:col-span-2",
  infra: "md:col-span-2",
  synergy: "md:col-span-2",
};

export function CapabilityBento(): React.JSX.Element {
  return (
    <section aria-labelledby="capabilities-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h2 id="capabilities-title" className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold leading-[1.15]">
          One partner for software and infrastructure
        </h2>
        <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-6 md:auto-rows-[minmax(220px,auto)]">
          {pillars.map((p) => (
            <SpotlightCard
              key={p.key}
              className={`flat-card flex flex-col justify-between rounded-[20px] p-6 ${spans[p.key] ?? ""}`}
            >
              <div>
                <p.icon size={20} className="text-accent" aria-hidden />
                <h3 className="mt-4 text-[1.25rem] font-semibold leading-[1.3]">{p.title}</h3>
                <p className="mt-2 max-w-[65ch] text-sm leading-relaxed text-text-muted">{p.description}</p>
              </div>
              <div className="mt-6">
                {p.key === "erp" ? <ErpVisual /> : p.key === "infra" ? <RackVisual /> : <MiniVisual kind={p.key} />}
                <Link href={p.href} className="mt-4 inline-block text-sm text-cyan hover:underline">
                  Learn more
                </Link>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </section>
  );
}

function MiniVisual({ kind }: { kind: string }): React.JSX.Element {
  if (kind === "ai") {
    return (
      <div aria-hidden className="rounded-[12px] border border-white/10 bg-white/[0.02] p-3 text-xs text-text-muted">
        <p className="rounded-lg bg-white/5 px-3 py-2">How is VLAN 30 isolated?</p>
        <p className="mt-2 font-mono text-[10px] text-cyan">Source: Network_Security_Spec.pdf</p>
      </div>
    );
  }
  if (kind === "synergy") {
    return (
      <div aria-hidden className="flex flex-col gap-1.5">
        {["AI agents", "Apps", "Runtime", "Servers", "Cabling"].map((l, i) => (
          <div
            key={l}
            className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-text-muted"
            style={{ opacity: 0.5 + i * 0.12 }}
          >
            {l}
          </div>
        ))}
      </div>
    );
  }
  return (
    <div aria-hidden className="rounded-[12px] border border-white/10 bg-black/40 p-3 font-mono text-[11px] leading-5">
      <span className="text-accent-2">const</span> <span className="text-text">app</span>{" "}
      <span className="text-text-muted">= ship(web, erp, ai)</span>
    </div>
  );
}

function ErpVisual(): React.JSX.Element {
  const mods = ["Finance", "Inventory", "CRM", "HR", "Orders", "Reports"];
  return (
    <div aria-hidden className="grid grid-cols-3 gap-2">
      {mods.map((m) => (
        <div key={m} className="rounded-[8px] border border-white/10 bg-white/[0.03] px-2 py-2 text-center text-[11px] text-text-muted">
          {m}
        </div>
      ))}
    </div>
  );
}

function RackVisual(): React.JSX.Element {
  return (
    <div aria-hidden className="flex items-center gap-3 rounded-[12px] border border-white/10 bg-black/40 p-3">
      <div className="flex flex-1 flex-col gap-1.5">
        {[0, 1, 2].map((r) => (
          <div key={r} className="h-1 rounded bg-white/10" />
        ))}
      </div>
      <div className="flex gap-1">
        {["bg-emerald", "bg-emerald", "bg-cyan", "bg-white/15"].map((c, i) => (
          <span key={i} className={`h-2 w-2 rounded-sm ${c}`} />
        ))}
      </div>
    </div>
  );
}
