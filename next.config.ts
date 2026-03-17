import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep Codama renderers and Node.js-only packages server-side only
  serverExternalPackages: [
    "codama",
    "@codama/nodes-from-anchor",
    "@codama/renderers-js",
    "@codama/renderers-js-umi",
    "@codama/renderers-rust",
    "memfs",
  ],
};

export default nextConfig;
