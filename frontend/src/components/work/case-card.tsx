import Link from "next/link";
import type { CaseStudySummary } from "@/lib/api/types";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { Badge } from "@/components/ui/badge";

export function CaseCard({ item }: { item: CaseStudySummary }): React.JSX.Element {
  return (
    <SpotlightCard className="flat-card overflow-hidden rounded-[20px]">
      <Link href={`/work/${item.slug}`} className="group block" aria-label={item.title}>
        <div className="grid-backdrop flex aspect-[16/9] items-center justify-center border-b border-white/10 bg-surface-2">
          <span className="font-mono text-xs uppercase tracking-wider text-text-faint">
            {item.service_category}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-text-muted">{item.client_industry}</p>
            <Badge className="capitalize">{item.service_category}</Badge>
          </div>
          <h3 className="mt-2 text-[1.25rem] font-semibold leading-[1.3]">{item.title}</h3>
          <div className="mt-4 flex gap-6">
            {item.headline_metrics.slice(0, 2).map((m) => (
              <div key={m.key}>
                <p className="font-mono text-lg text-text">{m.value}</p>
                <p className="text-xs text-text-muted">{m.label}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-rows-[0fr] transition-all duration-300 group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] [@media(hover:none)]:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <div className="flex flex-wrap gap-1.5 pt-4">
                {item.software_stack.slice(0, 4).map((s) => (
                  <span key={s} className="rounded-[8px] bg-white/10 px-2 py-1 font-mono text-[11px] text-text-muted">
                    {s}
                  </span>
                ))}
              </div>
              <p className="pt-3 text-sm text-cyan">View architecture →</p>
            </div>
          </div>
        </div>
      </Link>
    </SpotlightCard>
  );
}
