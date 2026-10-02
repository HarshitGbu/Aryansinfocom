"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { calculateEstimate } from "@/lib/api/endpoints";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { formatRange, formatWeeks } from "@/lib/format";
import type { EstimatorService } from "@/lib/api/types";
import { estimatorServiceMeta } from "@/content/pillars";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

const allServices = Object.keys(estimatorServiceMeta) as EstimatorService[];

export function EstimatorTeaser(): React.JSX.Element {
  const [selected, setSelected] = useState<EstimatorService[]>([]);
  const debounced = useDebouncedValue(selected, 400);

  const query = useQuery({
    queryKey: ["teaser", debounced],
    queryFn: () =>
      calculateEstimate({
        selected_services: debounced,
        office_parameters: {
          workstations: 10,
          floor_area_sqft: 1500,
          require_server_rack: false,
          air_gapped_security: false,
        },
        software_parameters: { user_roles_count: 3, third_party_integrations: [] },
      }),
    enabled: debounced.length > 0,
    placeholderData: (prev) => prev,
    retry: false,
  });

  const params = useMemo(() => selected.join(","), [selected]);

  function toggle(s: EstimatorService): void {
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  }

  return (
    <section aria-labelledby="teaser-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="flat-card grid gap-8 rounded-[20px] p-8 md:grid-cols-2">
          <div>
            <h2 id="teaser-title" className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold">
              Estimate your project in a minute
            </h2>
            <p className="mt-3 max-w-[65ch] text-text-muted">
              Pick what you need. We&apos;ll show a planning range for cost and timeline.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {allServices.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  aria-pressed={selected.includes(s)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition min-h-[44px]",
                    selected.includes(s)
                      ? "border-white bg-white/10 text-white"
                      : "border-white/10 text-text-muted hover:text-text",
                  )}
                >
                  {estimatorServiceMeta[s]?.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center">
            {selected.length === 0 ? (
              <p className="text-sm text-text-faint">Select at least one service.</p>
            ) : query.isPending && !query.data ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ) : query.isError ? (
              <div>
                <p className="text-sm text-text-muted">Couldn&apos;t calculate right now. Try again.</p>
                <button
                  type="button"
                  onClick={() => void query.refetch()}
                  className="mt-3 rounded-[12px] border border-white/15 px-4 py-2 text-sm"
                >
                  Retry
                </button>
              </div>
            ) : query.data ? (
              <div>
                <p className="font-mono text-3xl">{formatRange(query.data.cost_range_usd)}</p>
                <p className="mt-1 font-mono text-sm text-text-muted">{formatWeeks(query.data.timeline_weeks)}</p>
                <p className="mt-2 text-xs text-text-faint">Planning estimate. Refine it next.</p>
                <Link
                  href={`/estimator?services=${params}`}
                  className="mt-5 inline-flex rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-neutral-200"
                >
                  Refine this estimate
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
