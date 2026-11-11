import Link from "next/link";
import { getServices } from "@/lib/api/endpoints";
import { pillars } from "@/content/pillars";
import { deliverySteps } from "@/content/process";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { FooterCta } from "@/components/home/footer-cta";
import { baseMetadata } from "@/lib/seo";
import { breadcrumbJsonLd, toJsonLd } from "@/lib/jsonld";

export const revalidate = 60;

export const metadata = baseMetadata({
  title: "Services",
  description:
    "Custom web applications, enterprise ERP systems, AI and RAG tools, and turnkey office networking and hardware — designed, built, and supported by one team.",
  path: "/services",
});

const slugMap: Record<string, string> = {
  web: "web-apps",
  erp: "erp-systems",
  ai: "ai-solutions",
  infrastructure: "infrastructure",
};

export default async function ServicesPage(): Promise<React.JSX.Element> {
  let services = null;
  try {
    services = await getServices();
  } catch {
    services = null;
  }

  return (
    <main className="pt-28">
      <script
        type="application/ld+json"
        {...toJsonLd(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
          ]),
        )}
      />
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-semibold leading-[1.06]">Services</h1>
        <p className="mt-4 max-w-[65ch] text-lg text-text-muted">
          Software and infrastructure delivered by one team.
        </p>
      </div>
      <div className="mx-auto max-w-6xl space-y-4 px-5 py-12 md:px-8">
        {services === null ? (
          <p className="flat-card rounded-[20px] p-6 text-sm text-text-muted">
            Something went wrong loading this page. Try again.
          </p>
        ) : (
          services.map((s) => {
            const pillar = pillars.find((p) => p.category === s.category);
            const slug = slugMap[s.category] ?? s.slug;
            return (
              <SpotlightCard key={s.slug} className="flat-card grid gap-6 rounded-[20px] p-6 md:grid-cols-2">
                <div>
                  <h2 className="text-[1.25rem] font-semibold">{s.title}</h2>
                  <p className="mt-2 text-sm text-text-muted">{s.short_description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {s.technologies_used.map((t) => (
                      <span key={t} className="rounded-[8px] bg-white/10 px-2 py-1 font-mono text-[11px] text-text-muted">
                        {t}
                      </span>
                    ))}
                  </div>
                  <Link href={`/services/${slug}`} className="mt-4 inline-block text-sm text-cyan hover:underline">
                    Explore
                  </Link>
                </div>
                <ul className="space-y-2 text-sm text-text-muted">
                  {(pillar?.capabilities ?? []).map((c) => (
                    <li key={c} className="flex gap-2">
                      <span aria-hidden className="text-emerald">·</span> {c}
                    </li>
                  ))}
                </ul>
              </SpotlightCard>
            );
          })
        )}
      </div>
      <section aria-labelledby="delivery-title" className="mx-auto max-w-6xl px-5 py-12 md:px-8">
        <h2 id="delivery-title" className="text-2xl font-semibold">Delivery model</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-4">
          {deliverySteps.map((s, i) => (
            <li key={s.title} className="flat-card rounded-[20px] p-5">
              <p className="font-mono text-xs text-cyan">{i + 1}</p>
              <p className="mt-2 font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>
      <FooterCta />
    </main>
  );
}
