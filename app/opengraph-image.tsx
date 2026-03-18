import { ImageResponse } from "next/og";

export const alt = "Castaway — Solana IDL → SDK Generator";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "#09090b",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top: logo + name */}
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontSize: "56px" }}>🪃</span>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span
              style={{
                fontSize: "48px",
                fontWeight: "700",
                color: "#f4f4f5",
                lineHeight: 1,
              }}
            >
              Castaway
            </span>
            <span style={{ fontSize: "22px", color: "#71717a" }}>
              by dev-jodee
            </span>
          </div>
        </div>

        {/* Middle: headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <span
            style={{
              fontSize: "58px",
              fontWeight: "700",
              color: "#f4f4f5",
              lineHeight: 1.1,
              letterSpacing: "-1px",
            }}
          >
            Solana IDL →{" "}
            <span style={{ color: "#7c3aed" }}>SDK Generator</span>
          </span>
          <span style={{ fontSize: "26px", color: "#a1a1aa", maxWidth: "700px" }}>
            Paste a program ID. Fetch the on-chain IDL. Download a typed client
            in TypeScript or Rust — powered by Codama.
          </span>
        </div>

        {/* Bottom: badges */}
        <div style={{ display: "flex", gap: "16px" }}>
          {["TypeScript", "TypeScript Umi", "Rust", "Open Source"].map(
            (badge) => (
              <div
                key={badge}
                style={{
                  display: "flex",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "#18181b",
                  border: "1px solid #27272a",
                  color: "#a1a1aa",
                  fontSize: "18px",
                  fontWeight: "500",
                }}
              >
                {badge}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
