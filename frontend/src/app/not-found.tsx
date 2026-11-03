"use client";

import Link from "next/link";
import { usePaletteStore } from "@/lib/stores/palette-store";

export default function NotFound(): React.JSX.Element {
  const openPalette = usePaletteStore((s) => s.setOpen);

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-center justify-center px-5 text-center">
      <h1 className="text-3xl font-semibold">Page not found</h1>
      <p className="mt-3 max-w-[65ch] text-text-muted">That page doesn&apos;t exist or has moved.</p>
      <div className="mt-6 flex gap-3">
        <Link href="/" className="rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black">
          Go home
        </Link>
        <button
          type="button"
          onClick={() => openPalette(true)}
          className="rounded-[12px] border border-white/10 px-5 py-2.5 text-sm text-text-muted transition hover:bg-white/5"
        >
          Open search (⌘K)
        </button>
      </div>
    </main>
  );
}
