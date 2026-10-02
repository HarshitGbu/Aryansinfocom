"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

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
    <QueryClientProvider client={qc}>
      <LenisInit />
      {children}
    </QueryClientProvider>
  );
}
