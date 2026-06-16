import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb"
    },
    outputFileTracingExcludes: {
      "**/*": [".next/cache/**/*", ".git/**/*"]
    }
  }
};

export default nextConfig;
