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

  // codama-renderers-dart's broken exports map defeats Next's dependency tracer, so it and
  // its dependency closure are missing from the serverless bundle. Force-include the ESM
  // build's deps (dart + the codama/solana/noble packages it imports) for the generate route.
  outputFileTracingIncludes: {
    "/api/generate": [
      "./node_modules/codama-renderers-dart/**/*",
      "./node_modules/@codama/**/*",
      "./node_modules/@solana/**/*",
      "./node_modules/@noble/**/*",
    ],
  },

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
