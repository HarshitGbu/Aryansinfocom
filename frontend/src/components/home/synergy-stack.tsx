"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";

const layers = [
  { id: "cabling", label: "Cabling and network", caption: "Certified cabling and Wi-Fi surveyed on site." },
  { id: "servers", label: "Servers and GPU racks", caption: "Local racks sized for your workload and growth." },
  { id: "runtime", label: "Runtime and security", caption: "Hardened runtime with VLAN isolation and backups." },
  { id: "apps", label: "Business applications (Web, ERP)", caption: "Web platforms and ERP built on the same plan." },
  { id: "ai", label: "AI agents and tools", caption: "Air-gapped copilots grounded in your data." },
];

export function SynergyStack(): React.JSX.Element {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(4);

  useEffect(() => {
    if (reduce) {
      setActive(4);
      return;
    }
    if (window.innerWidth < 1024) {
      setActive(4);
      return;
    }
    let cleanup = (): void => undefined;
    let cancelled = false;
    void import("gsap").then((gsapMod) => {
      if (cancelled) return;
      void import("gsap/ScrollTrigger").then((st) => {
        if (cancelled) return;
        const gsap = gsapMod.default ?? gsapMod;
        const ScrollTrigger = st.ScrollTrigger ?? st.default;
        gsap.registerPlugin(ScrollTrigger);
        const ctx = gsap.context(() => {
          layers.forEach((_, i) => {
            ScrollTrigger.create({
              trigger: sectionRef.current,
              start: `${(i / layers.length) * 100}% center`,
              end: `${((i + 1) / layers.length) * 100}% center`,
              onEnter: () => setActive(i),
              onEnterBack: () => setActive(i),
            });
          });
        });
        cleanup = (): void => {
          ctx.revert();
        };
      });
    });
    return () => {
      cancelled = true;
      cleanup();
    };
  }, [reduce]);

  return (
    <section id="synergy" aria-labelledby="synergy-title" className="py-24 md:py-32">
      <div ref={sectionRef} className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2 md:px-8">
        <div className="md:sticky md:top-28 md:self-start">
          <h2 id="synergy-title" className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold">
            One team from cable to code
          </h2>
          <p className="mt-4 max-w-[65ch] text-text-muted">
            Software engineering and physical infrastructure under one roof, eliminating vendor friction.
          </p>
          <p key={active} className="mt-4 text-sm text-cyan" aria-live="polite">
            {layers[active]?.caption}
          </p>
          <Link href="/about" className="mt-4 inline-block text-sm text-cyan hover:underline">
            See how we work →
          </Link>
        </div>
        <div className="flex flex-col-reverse gap-3">
          {layers.map((l, i) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setActive(i)}
              aria-pressed={active === i}
              className={cn(
                "rounded-[20px] border px-5 py-4 text-left transition",
                active === i
                  ? "border-accent bg-white/[0.05] text-text shadow-[0_0_24px_rgba(99,102,241,0.25)]"
                  : "flat-card text-text-muted hover:text-text",
              )}
            >
              <span className="text-sm font-medium">{l.label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
