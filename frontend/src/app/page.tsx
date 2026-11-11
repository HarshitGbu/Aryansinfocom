import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { MetricRibbon } from "@/components/home/metric-ribbon";
import { CapabilityBento } from "@/components/home/capability-bento";
import { SynergyStack } from "@/components/home/synergy-stack";
import { TechSwitcher } from "@/components/home/tech-switcher";
import { FeaturedWork } from "@/components/home/featured-work";
import { EstimatorTeaser } from "@/components/home/estimator-teaser";
import { FooterCta } from "@/components/home/footer-cta";
import { baseMetadata, organizationJsonLd } from "@/lib/seo";
import { toJsonLd, websiteJsonLd } from "@/lib/jsonld";

export const metadata: Metadata = baseMetadata({
  description:
    "Custom web apps, enterprise ERPs, AI tools, and turnkey office infrastructure from one team.",
  path: "/",
});

export default function HomePage(): React.JSX.Element {
  return (
    <main>
      <script
        type="application/ld+json"
        {...toJsonLd(organizationJsonLd())}
      />
      <script
        type="application/ld+json"
        {...toJsonLd(websiteJsonLd())}
      />
      <Hero />
      <MetricRibbon />
      <CapabilityBento />
      <SynergyStack />
      <TechSwitcher />
      <FeaturedWork />
      <EstimatorTeaser />
      <FooterCta />
    </main>
  );
}
