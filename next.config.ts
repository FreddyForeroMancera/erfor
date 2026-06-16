import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb"
    },
    outputFileTracingIncludes: {
      "/*": ["./prisma/dev.db"],
      "/api/**/*": ["./prisma/dev.db"]
    }
  }
};

export default nextConfig;
