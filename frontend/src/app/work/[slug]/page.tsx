import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getCaseStudy } from "@/lib/api/endpoints";
import { ApiError } from "@/lib/api/client";
import { Markdown } from "@/components/ui/markdown";
import { Badge } from "@/components/ui/badge";
import { baseMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, toJsonLd } from "@/lib/jsonld";
import type { CaseStudy } from "@/lib/api/types";
import { workCover } from "@/lib/work-covers";
import { isValidSlug } from "@/lib/safe-url";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<ReturnType<typeof baseMetadata>> {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  try {
    const c = await getCaseStudy(slug);
    return baseMetadata({ title: c.title, description: c.problem_statement.slice(0, 150), path: `/work/${slug}` });
  } catch {
    return baseMetadata({ title: "Case study", description: "Case studies from Aryans Infocom across custom web apps, ERP, AI tools, and office infrastructure.", path: `/work/${slug}` });
  }
}

export default async function CaseDetail({ params }: { params: Promise<{ slug: string }> }): Promise<React.JSX.Element> {
  const { slug } = await params;
  if (!isValidSlug(slug)) notFound();
  let c: CaseStudy;
  try {
    c = await getCaseStudy(slug);
  } catch (e) {
    // Only a genuine 404 is "not found"; 500s/timeouts must hit the error boundary.
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  const cover = c.cover_image_url ?? workCover(c.slug ?? slug);

  return (
    <main className="pt-28">
      <script
        type="application/ld+json"
        {...toJsonLd(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Work", path: "/work" },
            { name: c.title, path: `/work/${slug}` },
          ]),
        )}
      />
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h1 className="text-4xl font-semibold">{c.title}</h1>
        <div className="mt-3 flex items-center gap-3 text-sm text-text-muted">
          <span>{c.client_industry}</span>
          <Badge className="capitalize">{c.service_category}</Badge>
        </div>
        {cover ? (
          <div className="grid-backdrop relative mt-8 aspect-[16/9] w-full overflow-hidden rounded-[20px] border border-white/10 bg-surface-2">
            <Image
              src={cover}
              alt={c.title}
              fill
              sizes="(min-width: 1280px) 1152px, 100vw"
              className="object-cover"
            />
          </div>
        ) : null}
        <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[20px] border border-white/10 bg-white/10 md:grid-cols-4">
          {c.metrics.map((m) => (
            <div key={m.key} className="bg-surface p-5">
              <p className="font-mono text-2xl">{m.value}</p>
              <p className="mt-1 text-xs text-text-muted">{m.label}</p>
            </div>
          ))}
        </div>
        <section aria-labelledby="problem" className="mt-10">
          <h2 id="problem" className="text-2xl font-semibold">Problem</h2>
          <p className="mt-3 max-w-[65ch] text-text-muted">{c.problem_statement}</p>
        </section>
        <section aria-labelledby="solution" className="mt-10">
          <h2 id="solution" className="text-2xl font-semibold">Solution architecture</h2>
          <div className="mt-4"><Markdown content={c.solution_architecture} /></div>
        </section>
        <section aria-labelledby="specs" className="mt-10">
          <h2 id="specs" className="text-2xl font-semibold">Technical specifications</h2>
          <dl className="mt-4 grid gap-3 md:grid-cols-2">
            {Object.entries(c.hardware_specs).map(([k, v]) => (
              <div key={k} className="flat-card rounded-[12px] p-4">
                <dt className="font-mono text-xs text-text-faint">{k}</dt>
                <dd className="mt-1 text-sm">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {c.software_stack.map((s) => (
              <span key={s} className="rounded-[8px] bg-white/10 px-2 py-1 font-mono text-[11px]">{s}</span>
            ))}
          </div>
        </section>
        <div className="my-12 rounded-[20px] border border-white/10 p-6 text-center">
          <Link href="/estimator" className="inline-flex rounded-[12px] bg-white px-6 py-3 text-sm font-semibold text-black">
            Estimate a similar project
          </Link>
        </div>
      </div>
    </main>
  );
}
