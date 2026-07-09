import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingExcludes: {
    "**/*": [".next/cache/**/*", ".git/**/*"]
  },
  // @napi-rs/canvas carga su binario nativo (.node) con un require dinámico por
  // plataforma que el file tracer de Next/Vercel no sigue; sin esto, el binario Linux
  // (@napi-rs/canvas-linux-x64-gnu / -musl) no llega a la función serverless y el OCR
  // de PDFs escaneados revienta con "DOMMatrix is not defined". Forzamos su inclusión
  // en las rutas que hacen OCR. El binario de Windows (dev local) se ignora en Vercel.
  outputFileTracingIncludes: {
    "/api/documents/upload": ["./node_modules/@napi-rs/canvas-linux-*/**/*"],
    "/api/portal/upload": ["./node_modules/@napi-rs/canvas-linux-*/**/*"]
  },
  // Paquetes con binarios nativos / workers propios: se cargan desde node_modules en
  // tiempo de ejecución en vez de que el bundler de Next los empaquete (necesario para
  // que el OCR funcione en la función serverless de Vercel).
  serverExternalPackages: ["pdf-parse", "tesseract.js", "@napi-rs/canvas", "pdfjs-dist"],
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
