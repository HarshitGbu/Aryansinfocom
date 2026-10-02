"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { metrics } from "@/content/metrics";

function Counter({ target }: { target: number }): React.JSX.Element {
  const reduce = useReducedMotion();
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (reduce) {
      setValue(target);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const tick = (t: number): void => {
            const p = Math.min(1, (t - start) / 1200);
            setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
          obs.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [target, reduce]);

  return <span ref={ref}>{value}</span>;
}

export function MetricRibbon(): React.JSX.Element {
  return (
    <section aria-label="Agency metrics" className="border-y border-white/10">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 py-10 md:grid-cols-4 md:px-8">
        {metrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-1">
            <span className="font-mono text-2xl font-medium md:text-3xl">
              {m.numeric !== null ? (
                <>
                  <Counter target={m.numeric} />
                  {m.value.replace(String(m.numeric), "")}
                </>
              ) : (
                m.value
              )}
            </span>
            <span className="text-sm text-text-muted">{m.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
