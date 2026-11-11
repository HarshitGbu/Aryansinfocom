// Shared JSON-LD (schema.org) helpers.
// Every page renders one <script type="application/ld+json"> per node type and
// uses these builders so @id values and absolute URLs stay consistent.

import { siteConfig } from "@/content/site";

// Normalise the configured origin once so absolute URLs never get a double slash.
const SITE_ORIGIN = siteConfig.url.replace(/\/+$/, "");

/** Canonical @id for the Organization node (used by Service.provider). */
export const ORGANIZATION_ID = `${SITE_ORIGIN}/#organization`;

/** Canonical @id for the WebSite node. */
export const WEBSITE_ID = `${SITE_ORIGIN}/#website`;

/** Turn a root-relative path into an absolute URL on the production origin. */
export function absoluteUrl(path = "/"): string {
  const normalised = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalised}`;
}

/**
 * Props for a native `<script type="application/ld+json">`.
 * `JSON.stringify` does not escape `<`, so replace it with `\u003c` to stop a
 * value such as `</script>` from breaking out of the script element.
 */
export function toJsonLd(value: unknown): {
  dangerouslySetInnerHTML: { __html: string };
} {
  return {
    dangerouslySetInnerHTML: {
      __html: JSON.stringify(value).replace(/</g, "\\u003c"),
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function breadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function websiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: siteConfig.name,
    url: absoluteUrl("/"),
  };
}

export interface ServiceJsonLdInput {
  name: string;
  description: string;
  path: string;
  serviceType?: string;
}

export function serviceJsonLd(input: ServiceJsonLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    provider: { "@id": ORGANIZATION_ID },
    url: absoluteUrl(input.path),
    ...(input.serviceType ? { serviceType: input.serviceType } : {}),
  };
}
