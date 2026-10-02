import { notFound } from "next/navigation";
import Link from "next/link";
import { getService, getCaseStudies } from "@/lib/api/endpoints";
import { Markdown } from "@/components/ui/markdown";
import { CaseCard } from "@/components/work/case-card";
import { baseMetadata } from "@/lib/seo";

export const revalidate = 60;

const validSlugs = ["web-apps", "erp-systems", "ai-solutions", "infrastructure"];

const estimateMap: Record<string, string> = {
  "web-apps": "custom_web",
  "erp-systems": "erp_custom",
  "ai-solutions": "ai_solutions",
  infrastructure: "office_networking",
};

const filterMap: Record<string, "web" | "erp" | "ai" | "hardware"> = {
  "web-apps": "web",
  "erp-systems": "erp",
  "ai-solutions": "ai",
  infrastructure: "hardware",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<ReturnType<typeof baseMetadata>> {
  const { slug } = await params;
  try {
    const s = await getService(slug);
    return baseMetadata({ title: s.title, description: s.short_description, path: `/services/${slug}` });
  } catch {
    return baseMetadata({ title: "Service", description: "Service detail.", path: `/services/${slug}` });
  }
}

export default async function ServiceDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.JSX.Element> {
  const { slug } = await params;
  if (!validSlugs.includes(slug)) notFound();

  let service = null;
  try {
    service = await getService(slug);
  } catch {
    throw new Error("Service failed to load");
  }

  let related: React.JSX.Element | null = null;
  try {
    const { case_studies } = await getCaseStudies({ filter: filterMap[slug], limit: 3 });
    if (case_studies.length > 0) {
      related = (
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {case_studies.map((c) => (
            <CaseCard key={c.slug} item={c} />
          ))}
        </div>
      );
    }
  } catch {
    related = null;
  }

  const headings = [...service.full_content.matchAll(/^## (.+)$/gm)].map((m) => m[1] as string);

  return (
    <main className="pt-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <nav aria-label="Breadcrumb" className="text-xs text-text-faint">
          <Link href="/services" className="hover:text-text">Services</Link> / {service.title}
        </nav>
        <h1 className="mt-3 text-4xl font-semibold">{service.title}</h1>
        <p className="mt-3 max-w-[65ch] text-text-muted">{service.short_description}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {service.technologies_used.map((t) => (
            <span key={t} className="rounded-[8px] bg-white/10 px-2 py-1 font-mono text-[11px]">{t}</span>
          ))}
        </div>
        <Link
          href={`/estimator?services=${estimateMap[slug] ?? ""}`}
          className="mt-6 inline-flex rounded-[12px] bg-white px-5 py-2.5 text-sm font-semibold text-black"
        >
          Estimate this project
        </Link>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:px-8 lg:grid-cols-[200px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-2">
            {headings.map((h) => (
              <a key={h} href={`#${h.toLowerCase().replace(/\s+/g, "-")}`} className="block border-l-2 border-transparent pl-3 text-sm text-text-muted hover:border-accent hover:text-text">
                {h}
              </a>
            ))}
          </div>
        </aside>
        <Markdown content={service.full_content} />
      </div>
      {related && (
        <section aria-label="Related work" className="mx-auto max-w-6xl px-5 pb-24 md:px-8">
          <h2 className="text-2xl font-semibold">Related work</h2>
          {related}
        </section>
      )}
    </main>
  );
}
