import type { MetadataRoute } from "next";
import { getServices, getCaseStudies } from "@/lib/api/endpoints";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticPaths = ["", "/services", "/work", "/estimator", "/about", "/contact"];
  const entries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: new Date(),
  }));

  try {
    const services = await getServices();
    for (const s of services) {
      entries.push({ url: `${base}/services/${s.slug}`, lastModified: new Date() });
    }
  } catch {
    // Fall back to the static list only.
  }

  try {
    // The API caps `limit` at 50 — page through instead of over-requesting.
    for (let offset = 0; offset < 500; offset += 50) {
      const { case_studies } = await getCaseStudies({ limit: 50, offset });
      for (const c of case_studies) {
        entries.push({ url: `${base}/work/${c.slug}`, lastModified: new Date() });
      }
      if (case_studies.length < 50) break;
    }
  } catch {
    // Fall back to the static list only.
  }

  return entries;
}
