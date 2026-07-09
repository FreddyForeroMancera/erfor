import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "**/*": [".next/cache/**/*", ".git/**/*"]
  },
  // Paquetes con binarios nativos / workers propios: se cargan desde node_modules en
  // tiempo de ejecución en vez de que el bundler de Next los empaquete (necesario para
  // que el OCR funcione en la función serverless de Vercel).
  serverExternalPackages: ["pdf-parse", "tesseract.js"],
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb"
    }
  },
  eslint: {
    // El lint corre como job aparte en CI (informativo, ver deuda de tipado en `npm run lint`).
    // No debe bloquear `next build`, igual que en apps/admin-web del monorepo hermano APPTUR.
    ignoreDuringBuilds: true
  }
};

export default nextConfig;
