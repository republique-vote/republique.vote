import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@republique/core"],
  // The zkPassport verifier depends on ~300 MB of WASM provers: load them
  // from node_modules at runtime instead of bundling them
  serverExternalPackages: ["@aztec/bb.js", "@aztec-foundation/bb.js"],
};

export default nextConfig;
