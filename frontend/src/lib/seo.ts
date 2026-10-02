import type { Metadata } from "next";
import { siteConfig } from "@/content/site";

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
  return {
    title: title
      ? { default: title, template: `%s · ${siteConfig.name}` }
      : { default: siteConfig.name, template: `%s · ${siteConfig.name}` },
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
    name: siteConfig.name,
    email: siteConfig.email,
    url: siteConfig.url,
  };
}
