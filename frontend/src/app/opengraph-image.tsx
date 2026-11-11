import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt =
  "Aryans Infocom — custom web apps, enterprise ERP, AI tools, and office infrastructure";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Inline the approved brand mark at build time so the card has no runtime
// network dependency (it renders identically with the backend down).
const logoDataUrl = `data:image/png;base64,${readFileSync(
  join(process.cwd(), "public/logo.png"),
).toString("base64")}`;

export default function OpengraphImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#050507",
          backgroundImage:
            "radial-gradient(circle at 82% 18%, rgba(99,102,241,0.35), transparent 42%), radial-gradient(circle at 12% 92%, rgba(34,211,238,0.22), transparent 45%)",
          padding: "72px",
          color: "#f4f4f5",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <img
            src={logoDataUrl}
            alt=""
            width={64}
            height={64}
            style={{ borderRadius: "14px" }}
          />
          <div
            style={{
              display: "flex",
              fontSize: "24px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "#a1a1aa",
            }}
          >
            Aryans Infocom
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              display: "flex",
              fontSize: "68px",
              fontWeight: 700,
              lineHeight: 1.08,
              letterSpacing: "-0.03em",
              maxWidth: "960px",
            }}
          >
            Web apps, ERP, AI, and the infrastructure underneath.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              lineHeight: 1.4,
              color: "#a1a1aa",
              maxWidth: "840px",
            }}
          >
            One team for software and physical IT — from architecture to
            production handover.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(255,255,255,0.14)",
            paddingTop: "24px",
            fontSize: "22px",
            color: "#d4d4d8",
          }}
        >
          <div style={{ display: "flex" }}>aryansinfocom.com</div>
          <div style={{ display: "flex", color: "#22d3ee" }}>Software + Infrastructure</div>
        </div>
      </div>
    ),
    size,
  );
}
