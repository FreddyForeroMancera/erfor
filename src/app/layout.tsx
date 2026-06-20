import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { ClientProvider } from "@/lib/client-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERFOR — Gestión Ambiental",
  description: "Gestión ambiental, trámites, expedientes, cumplimiento, documentos e IA para ERFOR."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <ClientProvider>
          <Toaster position="top-center" toastOptions={{ className: 'text-sm font-semibold' }} />
          {children}
        </ClientProvider>
      </body>
    </html>
  );
}
