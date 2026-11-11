import Link from "next/link";
import { getCaseStudies } from "@/lib/api/endpoints";
import { CaseCard } from "@/components/work/case-card";
import { WorkFilters } from "./work-filters";
import { caseStudyFilters } from "@/lib/work-filters";
import { baseMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, toJsonLd } from "@/lib/jsonld";
import type { CaseStudyFilter } from "@/lib/api/types";

export const revalidate = 60;

export const metadata = baseMetadata({
  title: "Work",
  description: "Case studies across web apps, ERP systems, AI tools, and office infrastructure.",
  path: "/work",
});

const validFilters = new Set<CaseStudyFilter>(caseStudyFilters.map((f) => f.value));

export default async function WorkPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>;
}): Promise<React.JSX.Element> {
  const { filter: rawFilter } = await searchParams;
  const requested = Array.isArray(rawFilter) ? rawFilter[0] : rawFilter;
  const filter: CaseStudyFilter = validFilters.has(requested as CaseStudyFilter)
    ? (requested as CaseStudyFilter)
    : "all";

  // Fetched on the server with ISR so case-study titles and links are present
  // in the initial HTML instead of only inside a client-side query.
  let data: Awaited<ReturnType<typeof getCaseStudies>> | null = null;
  try {
    data = await getCaseStudies({ filter, limit: 24 });
  } catch {
    data = null;
  }

  return (
    <main className="pt-28">
      <script
        type="application/ld+json"
        {...toJsonLd(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Work", path: "/work" },
          ]),
        )}
      />
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h1 className="text-4xl font-semibold">Work</h1>
        <WorkFilters active={filter} />
        <p aria-live="polite" className="mt-4 text-sm text-text-muted">
          {data ? `${data.total} case studies` : "Case studies currently unavailable"}
        </p>
        <div className="grid gap-4 py-8 md:grid-cols-2 lg:grid-cols-3">
          {data === null ? (
            <div className="col-span-full flat-card rounded-[20px] p-6 text-center">
              <p className="text-sm text-text-muted">Couldn&apos;t load case studies.</p>
              <Link
                href="/work"
                className="mt-3 inline-block rounded-[12px] border border-white/15 px-4 py-2 text-sm"
              >
                Try again
              </Link>
            </div>
          ) : data.case_studies.length === 0 ? (
            <div className="col-span-full flat-card rounded-[20px] p-6 text-center">
              <p className="text-sm">No case studies in this category yet.</p>
              <Link
                href="/work?filter=all"
                className="mt-3 inline-block rounded-[12px] bg-white px-4 py-2 text-sm font-semibold text-black"
              >
                Show all work
              </Link>
            </div>
          ) : (
            data.case_studies.map((c) => <CaseCard key={c.slug} item={c} />)
          )}
        </div>
      </div>
    </main>
  );
}
