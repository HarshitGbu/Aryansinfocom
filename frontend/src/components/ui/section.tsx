import { cn } from "@/lib/cn";

export function Section({
  id,
  labelledBy,
  className,
  children,
}: {
  id?: string;
  labelledBy: string;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section id={id} aria-labelledby={labelledBy} className={cn("py-24 md:py-32", className)}>
      <div className="mx-auto max-w-6xl px-5 md:px-8">{children}</div>
    </section>
  );
}
