"use client";

import { useCallback } from "react";

export function useMouseGlow<T extends HTMLElement>(): {
  onMouseMove: (e: React.MouseEvent<T>) => void;
} {
  const onMouseMove = useCallback((e: React.MouseEvent<T>) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mouse-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--mouse-y", `${e.clientY - r.top}px`);
  }, []);
  return { onMouseMove };
}
