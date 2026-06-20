"use client";

import { useState, use } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { AppShell } from "@/components/app-shell";
import { FilesModule } from "@/components/files-module";
import { Building2, Map, FolderKanban, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";



export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data, error, isLoading: loading } = useSWR<any>(`/api/clients?q=${resolvedParams.id}`, fetcher);
  const client = data?.items?.find((c: any) => c.id === resolvedParams.id);
  const [activeTab, setActiveTab] = useState<"info" | "expedientes" | "proyectos">("expedientes");
  const tabs = [
    { id: "info", label: "Información", icon: Building2 },
    { id: "expedientes", label: "Expedientes", icon: FolderKanban },
    { id: "proyectos", label: "Proyectos", icon: Map },
  ] as const;

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-erfor-green" />
        </div>
      </AppShell>
    );
  }

  if (!client) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p>Cliente no encontrado</p>
          <Link href="/clientes-y-proyectos" className="text-erfor-green hover:underline">Volver a Clientes</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 lg:p-6 xl:p-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/clientes-y-proyectos" className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-erfor-green hover:text-erfor-green transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{client.name}</h1>
            <p className="text-sm text-slate-500">
              {client.type} • {client.documentType || "NIT"}: {client.documentNumber}
            </p>
          </div>
        </div>

        <div className="mb-6 flex gap-2 border-b border-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "border-erfor-green text-erfor-green"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {activeTab === "info" && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-slate-800">Detalles del Cliente</h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Representante Legal</p>
                  <p className="mt-1 font-medium">{client.representative || "N/D"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Correo Electrónico</p>
                  <p className="mt-1 font-medium">{client.email || "N/D"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Teléfono</p>
                  <p className="mt-1 font-medium">{client.phone || "N/D"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Dirección</p>
                  <p className="mt-1 font-medium">{client.address || "N/D"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Ciudad / Departamento</p>
                  <p className="mt-1 font-medium">{client.city || "N/D"} / {client.department || "N/D"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">Prioridad</p>
                  <p className="mt-1 font-medium text-erfor-green">{client.priority || "MEDIUM"}</p>
                </div>
                <div className="col-span-full">
                  <p className="text-xs font-semibold text-slate-500 uppercase">Notas Internas</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{client.notes || "Sin notas adicionales."}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "expedientes" && (
            <div className="-mx-4 lg:-mx-6 xl:-mx-8">
              <FilesModule clientId={resolvedParams.id} />
            </div>
          )}

          {activeTab === "proyectos" && (
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm text-center">
              <FolderKanban className="mx-auto mb-3 h-12 w-12 text-slate-300" />
              <h3 className="text-lg font-medium text-slate-800">Proyectos Ambientales</h3>
              <p className="mt-1 text-sm text-slate-500">Módulo en construcción para vista de cliente.</p>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
