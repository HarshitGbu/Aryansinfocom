import { cn } from "@/lib/cn";

export function Kbd({ className, children }: { className?: string; children: React.ReactNode }): React.JSX.Element {
  return (
    <kbd
      className={cn(
        "inline-flex items-center gap-1 rounded-[8px] border border-white/20 bg-white/10 px-2 py-0.5 font-mono text-[10px] text-white/80",
        className,
      )}
    >
      {children}
    </kbd>
  );
}
