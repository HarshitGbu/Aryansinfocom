import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const staticPaths = ["", "/services", "/work", "/ai-lab", "/estimator", "/about", "/contact"];
  return staticPaths.map((p) => ({
    url: `${base}${p === "" ? "" : p}` || `${base}/`,
    lastModified: new Date(),
  }));
}
