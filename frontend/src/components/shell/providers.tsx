"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";

let client: QueryClient | null = null;

function getClient(): QueryClient {
  if (!client) {
    client = new QueryClient({
      defaultOptions: { queries: { retry: false, staleTime: 30_000 } },
    });
  }
  return client;
}

function LenisInit(): null {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ("ontouchstart" in window && window.innerWidth < 768) return;
    let lenis: { destroy: () => void } | null = null;
    let raf = 0;
    void import("lenis").then((m) => {
      const L = new m.default({ lerp: 0.12 });
      // Chrome/Edge restore the scroll position after a refresh, sometimes after
      // Lenis has already booted. Re-sync so the animation target does not clamp
      // wheel scrolling at a stale position.
      const resync = (): void => {
        L.scrollTo(window.scrollY, { immediate: true });
      };
      if (document.readyState === "complete") resync();
      else window.addEventListener("load", resync, { once: true });
      lenis = L;
      const loop = (t: number): void => {
        L.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelAnimationFrame(raf);
      lenis?.destroy();
    };
  }, []);
  return null;
}

export function Providers({ children }: { children: ReactNode }): React.JSX.Element {
  const [qc] = useState(getClient);
  return (
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={qc}>
        <LenisInit />
        {children}
      </QueryClientProvider>
    </MotionConfig>
  );
}
