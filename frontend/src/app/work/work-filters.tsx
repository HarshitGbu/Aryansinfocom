"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { caseStudyFilters } from "@/lib/work-filters";
import type { CaseStudyFilter } from "@/lib/api/types";

export function WorkFilters({ active }: { active: CaseStudyFilter }): React.JSX.Element {
  const router = useRouter();

  function setFilter(value: CaseStudyFilter): void {
    router.replace(`/work?filter=${value}`, { scroll: false });
  }

  return (
    <div className="mt-6 flex flex-wrap gap-2" role="group" aria-label="Filter case studies">
      {caseStudyFilters.map((f) => (
        <button
          key={f.value}
          onClick={() => setFilter(f.value)}
          aria-pressed={active === f.value}
          className={cn(
            "rounded-full border px-4 py-2 text-sm min-h-[44px]",
            active === f.value ? "bg-white/10 text-white border-white/20" : "border-white/10 text-text-muted",
          )}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
