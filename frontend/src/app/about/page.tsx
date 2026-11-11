import { aboutProcess, securityCommitments } from "@/content/process";
import { FooterCta } from "@/components/home/footer-cta";
import { baseMetadata } from "@/lib/seo";

export const metadata = baseMetadata({
  title: "About",
  description:
    "Aryans Infocom builds custom web apps, enterprise ERP systems, AI tools, and office infrastructure as one team — from discovery and architecture to launch.",
  path: "/about",
});

export default function AboutPage(): React.JSX.Element {
  return (
    <main className="pt-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <h1 className="text-4xl font-semibold">About</h1>
        <section aria-labelledby="how" className="mt-10">
          <h2 id="how" className="text-2xl font-semibold">How we work</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-3">
            <p className="text-text-muted">One team owns software and infrastructure, so nothing falls between vendors.</p>
            <p className="text-text-muted">We show working systems early, then harden them for production.</p>
            <p className="text-text-muted">We document everything and hand over credentials cleanly.</p>
          </div>
        </section>
        <section aria-labelledby="process" className="mt-16">
          <h2 id="process" className="text-2xl font-semibold">Process</h2>
          <ol className="mt-6 space-y-4">
            {aboutProcess.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="font-mono text-sm text-cyan">{i + 1}</span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-sm text-text-muted">{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section aria-labelledby="security" className="mt-16">
          <h2 id="security" className="text-2xl font-semibold">Security commitments</h2>
          <ul className="mt-4 divide-y divide-white/10 border-y border-white/10">
            {securityCommitments.map((s) => (
              <li key={s} className="py-3 text-sm text-text-muted">{s}</li>
            ))}
          </ul>
        </section>
        </div>
      <FooterCta />
    </main>
  );
}
