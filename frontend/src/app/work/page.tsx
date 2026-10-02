"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCaseStudies } from "@/lib/api/endpoints";
import { CaseCard } from "@/components/work/case-card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";
import type { CaseStudyFilter } from "@/lib/api/types";

const filters: Array<{ label: string; value: CaseStudyFilter }> = [
  { label: "All", value: "all" },
  { label: "Web", value: "web" },
  { label: "ERP", value: "erp" },
  { label: "AI", value: "ai" },
  { label: "Hardware", value: "hardware" },
  { label: "Hybrid", value: "hybrid" },
];

function WorkInner(): React.JSX.Element {
  const params = useSearchParams();
  const router = useRouter();
  const filter = (params.get("filter") as CaseStudyFilter) || "all";
  const [count, setCount] = useState<number | null>(null);

  const q = useQuery({
    queryKey: ["cases", filter],
    queryFn: () => getCaseStudies({ filter, limit: 24 }),
    retry: false,
  });

  useEffect(() => {
    if (q.data) setCount(q.data.total);
  }, [q.data]);

  function setFilter(v: CaseStudyFilter): void {
    router.replace(`/work?filter=${v}`, { scroll: false });
  }

  return (
    <main className="pt-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h1 className="text-4xl font-semibold">Work</h1>
        <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter case studies">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              aria-pressed={filter === f.value}
              className={cn(
                "rounded-full border px-4 py-2 text-sm min-h-[44px]",
                filter === f.value ? "bg-white/10 text-white border-white/20" : "border-white/10 text-text-muted",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p aria-live="polite" className="mt-4 text-sm text-text-muted">
          {q.data ? `${q.data.total} case studies` : count !== null ? `${count} case studies` : "Loading…"}
        </p>
        <div className="grid gap-4 py-8 md:grid-cols-2 lg:grid-cols-3">
          {q.isPending ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-72" />)
          ) : q.isError ? (
            <div className="col-span-full flat-card rounded-[20px] p-6 text-center">
              <p className="text-sm text-text-muted">Couldn&apos;t load case studies.</p>
              <button onClick={() => void q.refetch()} className="mt-3 rounded-[12px] border border-white/15 px-4 py-2 text-sm">
                Try again
              </button>
            </div>
          ) : q.data.case_studies.length === 0 ? (
            <div className="col-span-full flat-card rounded-[20px] p-6 text-center">
              <p className="text-sm">No case studies in this category yet.</p>
              <button onClick={() => setFilter("all")} className="mt-3 rounded-[12px] bg-white px-4 py-2 text-sm font-semibold text-black">
                Show all work
              </button>
            </div>
          ) : (
            q.data.case_studies.map((c) => <CaseCard key={c.slug} item={c} />)
          )}
        </div>
      </div>
    </main>
  );
}

export default function WorkPage(): React.JSX.Element {
  return (
    <Suspense>
      <WorkInner />
    </Suspense>
  );
}
