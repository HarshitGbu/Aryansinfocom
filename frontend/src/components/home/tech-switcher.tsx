"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { techGroups, techStack, type TechGroup } from "@/content/tech-stack";

export function TechSwitcher(): React.JSX.Element {
  const [filter, setFilter] = useState<"All" | TechGroup>("All");
  const items = filter === "All" ? techStack : techStack.filter((t) => t.group === filter);

  return (
    <section aria-labelledby="stack-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h2 id="stack-title" className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold">
          Built on proven technology
        </h2>
        <div role="tablist" aria-label="Technology groups" className="mt-6 flex flex-wrap gap-2">
          {techGroups.map((g) => (
            <button
              key={g}
              role="tab"
              aria-selected={filter === g}
              onClick={() => setFilter(g)}
              className={cn(
                "rounded-full border border-white/10 px-4 py-2 text-sm text-text-muted transition",
                filter === g && "bg-white/10 text-white",
              )}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
          {items.map((t) => (
            <div key={t.name} className="flat-card rounded-[20px] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white/10 font-mono text-xs text-cyan">
                {t.name.slice(0, 2).toUpperCase()}
              </div>
              <p className="mt-3 text-sm font-medium">{t.name}</p>
              <p className="text-xs text-text-faint">{t.role}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
