import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://aryansinfocom.com";
  return {
    rules: [
      // Search engines and AI citation crawlers: explicitly welcomed.
      {
        userAgent: [
          "Googlebot",
          "Bingbot",
          "OAI-SearchBot",
          "Claude-SearchBot",
          "PerplexityBot",
        ],
        allow: "/",
        disallow: "/api/",
      },
      // AI training and user-triggered crawlers: allowed so the site can be
      // quoted and cited in AI answers.
      {
        userAgent: [
          "GPTBot",
          "ClaudeBot",
          "Google-Extended",
          "ChatGPT-User",
          "Claude-User",
          "Perplexity-User",
        ],
        allow: "/",
        disallow: "/api/",
      },
      { userAgent: "*", allow: "/", disallow: "/api/" },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
