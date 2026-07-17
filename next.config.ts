import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const nextConfig: NextConfig = {
  // Keep Codama renderers and Node.js-only packages server-side only
  serverExternalPackages: [
    "codama",
    "@codama/nodes-from-anchor",
    "@codama/renderers-js",
    "@codama/renderers-js-umi",
    "@codama/renderers-rust",
    "@codama/renderers-go",
    "codama-renderers-dart",
    "memfs",
  ],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
