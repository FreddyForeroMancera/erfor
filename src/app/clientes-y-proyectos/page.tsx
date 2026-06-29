"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { FilesModule } from "@/components/files-module";
import { ClientsModule } from "@/components/clients-module";

export default function ClientesYProyectosPage() {
  const [activeTab, setActiveTab] = useState<"clientes" | "expedientes">("clientes");

  return (
    <AppShell>
      <div className="border-b border-slate-200 bg-white px-4 lg:px-8 pt-4">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab("clientes")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition ${
              activeTab === "clientes"
                ? "border-erfor-green text-erfor-green"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            Directorio de Clientes
          </button>
          <button
            onClick={() => setActiveTab("expedientes")}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition ${
              activeTab === "expedientes"
                ? "border-erfor-green text-erfor-green"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            Expedientes y Trámites
          </button>
        </nav>
      </div>

      <div>
        {activeTab === "clientes" ? <ClientsModule /> : <FilesModule />}
      </div>
    </AppShell>
  );
}
