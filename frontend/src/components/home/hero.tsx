"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Command, ArrowRight, Terminal, ShieldCheck } from "lucide-react";
import { usePaletteStore } from "@/lib/stores/palette-store";
import { copy } from "@/content/copy";

const ease = [0.16, 1, 0.3, 1] as const;

const codeLines = [
  [["const ", "kw"], ["project", "id"], [" = ", "pl"], ["defineProject", "fn"], ["({", "pl"]],
  [["  software: ", "pl"], ['["web", "erp", "ai"]', "str"], [",", "pl"]],
  [["  network: ", "pl"], ['"cabling + Wi-Fi"', "str"], [",", "pl"]],
  [["  compute: ", "pl"], ['"local GPU rack"', "str"], [",", "pl"]],
  [["  aiMode: ", "pl"], ['"air-gapped"', "str"]],
  [["});", "pl"]],
  [["await ", "kw"], ["project", "id"], [".", "pl"], ["deliver", "fn"], ["();", "pl"]],
] as const;

const tone: Record<string, string> = {
  kw: "text-accent-2",
  id: "text-text",
  fn: "text-cyan",
  str: "text-emerald",
  pl: "text-text-muted",
};

export function Hero(): React.JSX.Element {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const openPalette = usePaletteStore((s) => s.setOpen);

  function onMove(e: React.MouseEvent<HTMLDivElement>): void {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
  }

  const enter = (delay: number, y = 20): object =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease },
        };

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      onMouseMove={onMove}
      aria-labelledby="hero-title"
      className="spotlight-card relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden px-5 pb-16 pt-28"
    >
      <div className="raycast-glow !opacity-100" aria-hidden />
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-[38%] h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-tr from-accent/30 via-accent-2/20 to-pink-500/20 blur-[140px]" />
      <div aria-hidden className="grid-backdrop pointer-events-none absolute inset-0" />

      <motion.button
        {...enter(0)}
        onClick={() => openPalette(true)}
        className="relative mb-8 inline-flex items-center gap-3 rounded-full border border-white/15 bg-white/[0.04] px-4 py-1.5 text-xs text-text-muted backdrop-blur-xl transition-colors hover:bg-white/[0.08]"
      >
        <span className="h-2 w-2 rounded-full bg-cyan shadow-[0_0_8px_#22d3ee]" />
        <span>Software + infrastructure, one team</span>
        <span className="h-3 w-px bg-white/20" />
        <kbd className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/80">
          <Command size={10} /> K
        </kbd>
      </motion.button>

      <motion.h1
        id="hero-title"
        {...enter(0.1)}
        className="relative max-w-5xl bg-gradient-to-b from-white via-white/90 to-white/40 bg-clip-text text-center text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.06] tracking-tight text-transparent"
      >
        {copy.hero.title}
      </motion.h1>

      <motion.p {...enter(0.2)} className="relative mt-6 max-w-2xl text-center text-lg leading-relaxed text-text-muted">
        {copy.hero.subtitle}
      </motion.p>

      <motion.div {...enter(0.3)} className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
        <Link href="/estimator" className="group flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black shadow-[0_10px_30px_rgba(255,255,255,0.15)] transition hover:bg-neutral-200 active:scale-95">
          {copy.hero.primaryCta}
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </Link>
        <Link href="/contact#book" className="liquid-glass flex items-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition hover:bg-white/10 active:scale-95">
          <Terminal size={16} className="text-text-muted" />
          {copy.hero.secondaryCta}
        </Link>
      </motion.div>

      <motion.div
        initial={reduce === true ? false : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4, ease }}
        className="liquid-glass relative mt-16 w-full max-w-5xl overflow-hidden rounded-[28px]"
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex gap-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-3 w-3 rounded-full border border-white/30 bg-white/20" />
            ))}
          </div>
          <span className="font-mono text-xs tracking-wider text-text-muted">stack.config.ts</span>
          <ShieldCheck size={14} className="text-accent-2" aria-hidden />
        </div>

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 md:p-8">
          <div className="rounded-2xl border border-white/10 bg-black/40 p-6 md:col-span-2">
            <div className="mb-4 flex items-center justify-between font-mono text-xs">
              <span className="flex items-center gap-2 text-emerald">
                <span className="h-2 w-2 animate-ping rounded-full bg-emerald" aria-hidden /> Delivery plan
              </span>
              <span className="text-text-faint">TypeScript</span>
            </div>
            <pre className="overflow-x-auto font-mono text-xs leading-6">
              <code>
                {codeLines.map((line, i) => (
                  <motion.span
                    key={i}
                    className="block"
                    initial={reduce === true ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.0 + i * 0.12, duration: 0.2 }}
                  >
                    {line.map(([t, k], j) => (
                      <span key={j} className={tone[k]}>{t}</span>
                    ))}
                  </motion.span>
                ))}
              </code>
            </pre>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">AI inference</span>
              <span className="rounded border border-cyan/20 bg-cyan/10 px-2 py-0.5 font-mono text-[10px] text-cyan">VLAN 30</span>
            </div>
            <div className="my-4">
              <p className="text-sm text-text-muted">Outbound traffic: blocked</p>
              <div className="mt-3 flex gap-1.5" aria-hidden>
                {["bg-emerald", "bg-emerald", "bg-emerald", "bg-emerald", "bg-cyan animate-pulse", "bg-white/15"].map((c, i) => (
                  <span key={i} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
                ))}
              </div>
            </div>
            <div aria-hidden className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full w-[64%] bg-cyan" />
            </div>
            <span className="sr-only">GPU load indicator, decorative</span>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
