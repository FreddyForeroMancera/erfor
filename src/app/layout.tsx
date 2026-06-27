import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import { ClientProvider } from "@/lib/client-context";
import { SWRConfig } from "swr";
import "./globals.css";

export const metadata: Metadata = {
  title: "ERFOR — Gestión Ambiental",
  description: "Gestión ambiental, trámites, expedientes, cumplimiento, documentos e IA para ERFOR."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <SWRConfig
          value={{
            revalidateOnFocus: false,       // ← Evita recargar al cambiar de pestaña/ventana
            revalidateOnReconnect: false,   // ← Evita recargar al reconectar internet
            shouldRetryOnError: false,      // ← Evita el bucle de reintentos cuando la API falla
            dedupingInterval: 10000,        // ← Evita peticiones duplicadas en los últimos 10s
          }}
        >
          <ClientProvider>
            <Toaster position="top-center" toastOptions={{ className: 'text-sm font-semibold' }} />
            {children}
          </ClientProvider>
        </SWRConfig>
      </body>
    </html>
  );
}
