"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
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

type LenisLike = {
  scrollTo: (target: number, options?: { immediate?: boolean }) => void;
  destroy: () => void;
};

let lenisInstance: LenisLike | null = null;

function resyncLenis(): void {
  lenisInstance?.scrollTo(window.scrollY, { immediate: true });
}

function LenisInit(): null {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if ("ontouchstart" in window && window.innerWidth < 768) return;
    let cancelled = false;
    let raf = 0;
    void import("lenis").then((m) => {
      // A fast-refresh remount can leave this import pending while cleanup
      // already ran; do not boot a second live instance on top of it.
      if (cancelled) return;
      const L = new m.default({ lerp: 0.12 });
      // Chrome/Edge restore the scroll position after a refresh, sometimes after
      // Lenis has already booted. Re-sync so the animation target does not clamp
      // wheel scrolling at a stale position.
      if (document.readyState === "complete") resyncLenis();
      else window.addEventListener("load", resyncLenis, { once: true });
      lenisInstance = L;
      const loop = (t: number): void => {
        L.raf(t);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      lenisInstance?.destroy();
      lenisInstance = null;
    };
  }, []);

  useEffect(() => {
    // Client-side navigations never fire "load". Re-sync so Lenis does not keep
    // the previous route's animation target, which rubber-bands the new page
    // back to the old scroll offset and clamps the wheel.
    resyncLenis();
  }, [pathname]);

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
