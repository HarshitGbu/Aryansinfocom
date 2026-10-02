import Link from "next/link";
import { copy } from "@/content/copy";

export function FooterCta(): React.JSX.Element {
  return (
    <section aria-labelledby="footer-cta-title" className="py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="liquid-glass rounded-[28px] px-6 py-16 text-center md:px-16">
          <h2 id="footer-cta-title" className="text-[clamp(1.75rem,3.5vw,2.5rem)] font-semibold">
            {copy.footerCta.heading}
          </h2>
          <p className="mx-auto mt-3 max-w-[65ch] text-text-muted">{copy.footerCta.text}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/estimator" className="rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-black hover:bg-neutral-200 active:scale-95">
              {copy.hero.primaryCta}
            </Link>
            <Link href="/contact#book" className="rounded-xl border border-white/15 px-7 py-3.5 text-sm hover:bg-white/10 active:scale-95">
              {copy.hero.secondaryCta}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
