import { Skeleton } from "@/components/ui/skeleton";

export default function Loading(): React.JSX.Element {
  return (
    <main className="mx-auto max-w-6xl px-5 pt-28 md:px-8">
      <Skeleton className="h-10 w-1/3" />
      <div className="mt-8 space-y-4">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </main>
  );
}
