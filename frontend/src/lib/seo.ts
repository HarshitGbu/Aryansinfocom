import type { Metadata } from "next";
import { siteConfig } from "@/content/site";
import { absoluteUrl, ORGANIZATION_ID } from "@/lib/jsonld";

export function baseMetadata({
  title,
  description,
  path = "/",
}: {
  title?: string;
  description: string;
  path?: string;
}): Metadata {
  const url = `${siteConfig.url}${path}`;
  // The template lives in the root layout so it applies to child route
  // segments. A page-level `title.template` is ignored because a page is
  // always the terminating segment, which is what produced the duplicated
  // "Aryans Infocom · Aryans Infocom" homepage title.
  return {
    title: title ? title : { absolute: siteConfig.name },
    description,
    metadataBase: new URL(siteConfig.url),
    alternates: { canonical: url },
    openGraph: {
      title: title ?? siteConfig.name,
      description,
      url,
      siteName: siteConfig.name,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: title ?? siteConfig.name, description },
  };
}

export function organizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORGANIZATION_ID,
    name: siteConfig.name,
    url: absoluteUrl("/"),
    // The square brand mark (512x512) lives in public/ and is copied there from
    // the approved source artwork, so it is stable across favicon revisions.
    logo: absoluteUrl("/logo.png"),
    email: siteConfig.email,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: siteConfig.email,
    },
    // Only emit sameAs when profiles are actually configured (currently none).
    ...(siteConfig.social.length > 0
      ? { sameAs: siteConfig.social.map((profile) => profile.href) }
      : {}),
    // Intentionally no `address`/`location`: siteConfig.address is still the
    // San Francisco placeholder. Add a PostalAddress here once the real office
    // address is confirmed, so LocalBusiness can reuse this node later.
  };
}
