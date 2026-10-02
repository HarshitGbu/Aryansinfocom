import { cn } from "@/lib/cn";

export function GlassPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return <div className={cn("liquid-glass rounded-[20px]", className)}>{children}</div>;
}
