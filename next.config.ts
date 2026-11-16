import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@republique/core"],
  // The zkPassport verifier depends on ~300 MB of WASM provers: load them
  // from node_modules at runtime instead of bundling them
  serverExternalPackages: ["@aztec/bb.js", "@aztec-foundation/bb.js"],
  images: {
    // Official MP photos, proxied by next/image so visitors' browsers never
    // contact the Assemblée nationale
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www2.assemblee-nationale.fr",
        pathname: "/static/tribun/**",
      },
    ],
  },
};

export default nextConfig;
