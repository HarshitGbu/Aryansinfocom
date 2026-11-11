import type { MetadataRoute } from "next";
import { getServices, getCaseStudies } from "@/lib/api/endpoints";

// Stable content date rather than "now": a lastModified that changes on every
// request tells crawlers nothing. Bump this when the site content changes.
const LAST_MODIFIED = new Date("2026-11-11T00:00:00.000Z");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aryansinfocom.com";
  const staticPaths = [
    "",
    "/services",
    "/work",
    "/estimator",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
  ];
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: LAST_MODIFIED,
  }));

  try {
    const services = await getServices();
    for (const s of services) {
      entries.push({ url: `${base}/services/${s.slug}`, lastModified: LAST_MODIFIED });
    }
  } catch {
    // Fall back to the static list only.
  }

  try {
    // The API caps `limit` at 50 — page through instead of over-requesting.
    for (let offset = 0; offset < 500; offset += 50) {
      const { case_studies } = await getCaseStudies({ limit: 50, offset });
      for (const c of case_studies) {
        entries.push({ url: `${base}/work/${c.slug}`, lastModified: LAST_MODIFIED });
      }
      if (case_studies.length < 50) break;
    }
  } catch {
    // Fall back to the static list only.
  }

  return entries;
}
