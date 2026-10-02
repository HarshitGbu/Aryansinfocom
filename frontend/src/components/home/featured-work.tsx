import Link from "next/link";
import { getCaseStudies } from "@/lib/api/endpoints";
import { CaseCard } from "@/components/work/case-card";

export async function FeaturedWork(): Promise<React.JSX.Element | null> {
  try {
    const { case_studies } = await getCaseStudies({ limit: 3 });
    if (case_studies.length === 0) return null;
    return (
      <section aria-labelledby="recent-work-title" className="py-24 md:py-32">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <div className="flex items-end justify-between">
            <h2 id="recent-work-title" className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold">
              Recent work
            </h2>
            <Link href="/work" className="text-sm text-cyan hover:underline">
              View all work
            </Link>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {case_studies.map((c) => (
              <CaseCard key={c.slug} item={c} />
            ))}
          </div>
        </div>
      </section>
    );
  } catch {
    return (
      <section aria-label="Recent work" className="py-24">
        <div className="mx-auto max-w-6xl px-5 md:px-8">
          <Link href="/work" className="flat-card block rounded-[20px] p-6 text-sm text-text-muted hover:text-text">
            Case studies are loading slowly. Browse all work.
          </Link>
        </div>
      </section>
    );
  }
}
