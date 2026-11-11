import type { NextConfig } from "next";
import { resolveHttpOrigin } from "./src/lib/safe-url";

const isDev = process.env.NODE_ENV === "development";

const apiOrigin = resolveHttpOrigin(process.env.NEXT_PUBLIC_API_BASE_URL);
const connectSources = Array.from(
  new Set([
    "'self'",
    "https://api.web3forms.com",
    "https://app.cal.com",
    "https://cal.com",
    ...(apiOrigin ? [apiOrigin] : []),
    ...(isDev ? ["http://localhost:8000", "http://127.0.0.1:8000"] : []),
  ]),
).join(" ");

// Static/ISR pages emit inline Next.js RSC hydration scripts and Framer Motion /
// Cal.com embed runtime styles, so static-compatible CSP uses 'unsafe-inline'
// instead of per-request nonces (which force dynamic rendering on every route).
const cspHeader = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://app.cal.com https://cal.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data: https://app.cal.com https://cal.com",
  "font-src 'self' data: https://cal.com https://app.cal.com",
  `connect-src ${connectSources}`,
  "frame-src 'self' https://app.cal.com https://cal.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://api.web3forms.com",
  "frame-ancestors 'none'",
].join("; ");

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/ai-lab",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;