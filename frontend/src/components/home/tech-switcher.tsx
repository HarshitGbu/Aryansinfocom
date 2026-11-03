"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { techGroups, techStack, type TechGroup } from "@/content/tech-stack";

function logoSlug(name: string): string {
  return name.toLowerCase().replace(/ /g, "-").replace(/\./g, "");
}

export function TechSwitcher(): React.JSX.Element {
  const [filter, setFilter] = useState<"All" | TechGroup>("All");
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const items = filter === "All" ? techStack : techStack.filter((t) => t.group === filter);

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    const i = techGroups.indexOf(filter);
    let next: number;
    switch (e.key) {
      case "ArrowRight":
        next = (i + 1) % techGroups.length;
        break;
      case "ArrowLeft":
        next = (i - 1 + techGroups.length) % techGroups.length;
        break;
      case "Home":
        next = 0;
        break;
      case "End":
        next = techGroups.length - 1;
        break;
      default:
        return;
    }
    e.preventDefault();
    const target = techGroups[next];
    if (target === undefined) return;
    setFilter(target);
    tabRefs.current[next]?.focus();
  }

  return (
    <section aria-labelledby="stack-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h2 id="stack-title" className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold">
          Built on proven technology
        </h2>
        <div role="tablist" aria-label="Technology groups" onKeyDown={onKeyDown} className="mt-6 flex flex-wrap gap-2">
          {techGroups.map((g, i) => (
            <button
              key={g}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              id={`tech-tab-${g}`}
              role="tab"
              aria-selected={filter === g}
              aria-controls="tech-panel"
              tabIndex={filter === g ? 0 : -1}
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
        <div
          role="tabpanel"
          id="tech-panel"
          aria-labelledby={`tech-tab-${filter}`}
          tabIndex={0}
          className="mt-8 grid grid-cols-2 gap-3 focus:outline-none md:grid-cols-3 lg:grid-cols-6"
        >
          {items.map((t) => (
            <div key={t.name} className="flat-card rounded-[20px] p-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-white/95 p-1">
                <Image
                  src={`/logos/${logoSlug(t.name)}.png`}
                  alt={t.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
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
