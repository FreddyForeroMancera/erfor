"use client";

import { useState, use } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { AppShell } from "@/components/app-shell";
import { FilesModule } from "@/components/files-module";
import { Building2, Map, FolderKanban, Loader2, ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { NewTramiteModal } from "@/components/new-tramite-modal";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data, error, isLoading } = useSWR(`/api/clients/${resolvedParams.id}`, fetcher);
  const [activeTab, setActiveTab] = useState<"info" | "expedientes" | "proyectos">("info");
  const [isNewTramiteOpen, setIsNewTramiteOpen] = useState(false);

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-erfor-green mb-4" />
            <p className="text-sm font-medium text-slate-500">Cargando hoja de vida del cliente...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !data?.client) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center p-4">
          <div className="flex max-w-sm flex-col items-center text-center p-8 bg-red-50 rounded-2xl border border-red-100">
            <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="font-bold text-red-800">Cliente no encontrado</h3>
            <p className="text-sm text-red-600 mt-2">Es posible que el cliente haya sido eliminado o no tengas acceso.</p>
            <Link href="/clientes-y-proyectos" className="mt-6 text-sm font-semibold bg-white border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-sm">
              Volver al directorio
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const { client } = data;
  const projectsCount = client._count?.projects || 0;
  const filesCount = client._count?.environmentalFiles || 0;

  const tabs = [
    { id: "info", label: "Información General", icon: Building2 },
    { id: "expedientes", label: `Expedientes (${filesCount})`, icon: FolderKanban },
    { id: "proyectos", label: `Predios y Plantas (${projectsCount})`, icon: Map },
  ] as const;

  return (
    <AppShell>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/clientes-y-proyectos" className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-erfor-green hover:text-erfor-green hover:shadow-sm transition">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold text-slate-800">{client.name}</h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${client.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${client.status === 'ACTIVE' ? 'bg-green-600' : 'bg-slate-400'}`}></span>
                  {client.status === 'ACTIVE' ? 'Activo' : 'Suspendido'}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {client.type} • {client.documentType || "NIT"}: {client.documentNumber || "N/D"}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
              Editar Cliente
            </button>
            <button 
              onClick={() => setIsNewTramiteOpen(true)}
              className="px-4 py-2 bg-erfor-green text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition shadow-sm"
            >
              Nuevo Trámite
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-slate-200 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-semibold transition whitespace-nowrap ${
                  isActive
                    ? "border-erfor-green text-erfor-green"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-erfor-green' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[400px]">
          {activeTab === "info" && (
            <div className="grid lg:grid-cols-3 gap-6">
              
              {/* Main Info Card */}
              <div className="lg:col-span-2 space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
                  <h2 className="mb-6 text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-erfor-green" />
                    Perfil Corporativo
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-y-6 gap-x-8">
                    
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Representante Legal</p>
                      <p className="font-medium text-slate-800 text-lg">{client.representative || "N/D"}</p>
                    </div>
                    
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prioridad de Atención</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${client.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {client.priority || "MEDIUM"}
                      </span>
                    </div>

                    <div className="col-span-2 pt-4 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Datos de Contacto</p>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-slate-500"><Mail className="h-4 w-4" /></div>
                          <div className="truncate">
                            <p className="text-xs text-slate-500">Correo Principal</p>
                            <p className="font-semibold text-slate-700 text-sm truncate">{client.email || "N/D"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-slate-500"><Phone className="h-4 w-4" /></div>
                          <div>
                            <p className="text-xs text-slate-500">Teléfono</p>
                            <p className="font-semibold text-slate-700 text-sm">{client.phone || "N/D"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 sm:col-span-2">
                          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-slate-500"><MapPin className="h-4 w-4" /></div>
                          <div>
                            <p className="text-xs text-slate-500">Ubicación Registrada</p>
                            <p className="font-semibold text-slate-700 text-sm">{client.address || "N/D"}, {client.city || "N/D"}, {client.department || "N/D"}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Side Info */}
              <div className="space-y-6">
                
                {/* System Info */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Información del Sistema</h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Fecha de Creación</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{client.createdAt ? new Date(client.createdAt).toLocaleDateString('es-CO') : "N/D"}</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <Clock className="h-5 w-5 text-slate-400 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Última Actualización</p>
                        <p className="text-sm font-medium text-slate-700 mt-0.5">{client.updatedAt ? new Date(client.updatedAt).toLocaleDateString('es-CO') : "N/D"}</p>
                      </div>
                    </li>
                  </ul>
                </div>

                {/* Notes */}
                <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6 shadow-sm">
                  <h3 className="font-bold text-yellow-800 mb-2">Notas Internas</h3>
                  <p className="text-sm text-yellow-900 whitespace-pre-wrap leading-relaxed">
                    {client.notes || "No hay notas adicionales registradas para este cliente."}
                  </p>
                </div>

              </div>
            </div>
          )}

          {activeTab === "expedientes" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <FilesModule clientId={resolvedParams.id} />
            </div>
          )}

          {activeTab === "proyectos" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 shadow-sm text-center animate-in fade-in duration-300">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Map className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Predios y Plantas</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Esta sección estará disponible en la próxima actualización para gestionar las ubicaciones físicas del cliente.</p>
            </div>
          )}
        </div>
      </div>
      
      <NewTramiteModal 
        isOpen={isNewTramiteOpen} 
        onClose={() => setIsNewTramiteOpen(false)} 
        clientId={resolvedParams.id}
      />
    </AppShell>
  );
}
