"use client";

import dynamic from "next/dynamic";

const Palette = dynamic(
  () => import("@/components/shell/command-palette").then((m) => m.CommandPalette),
  { ssr: false },
);

export function PaletteLazy(): React.JSX.Element {
  return <Palette />;
}
