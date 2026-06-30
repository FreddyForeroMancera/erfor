"use client";

import { useState, use } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { AppShell } from "@/components/app-shell";
import { ArrowLeft, Loader2, FileText, CheckCircle2, Clock, AlertTriangle, Cloud, Settings, Building2, MapPin } from "lucide-react";
import Link from "next/link";
import { DocumentsModule } from "@/components/documents-module";
import { ObligationsModule } from "@/components/obligations-module";
import { ExpedienteStatusTracker } from "@/components/expediente-status-tracker";

export default function ExpedienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: file, error, isLoading, mutate } = useSWR<any>(`/api/expedientes/${resolvedParams.id}`, fetcher);
  const [activeTab, setActiveTab] = useState<"resumen" | "documentos" | "obligaciones">("resumen");

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-erfor-green mb-4" />
            <p className="text-sm font-medium text-slate-500">Cargando expediente digital...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !file) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center p-4">
          <div className="flex max-w-sm flex-col items-center text-center p-8 bg-red-50 rounded-2xl border border-red-100">
            <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
            <h3 className="font-bold text-red-800">Expediente no encontrado</h3>
            <p className="text-sm text-red-600 mt-2">El expediente fue eliminado o no tienes permisos de acceso.</p>
            <Link href="/clientes-y-proyectos" className="mt-6 text-sm font-semibold bg-white border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-sm">
              Volver al inicio
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  const tabs = [
    { id: "resumen", label: "Resumen General", icon: FileText },
    { id: "documentos", label: `Documentos Soportes (${file.documents?.length || 0})`, icon: Cloud },
    { id: "obligaciones", label: "Obligaciones & Tareas", icon: CheckCircle2 },
  ] as const;



  return (
    <AppShell>
      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href={`/clientes/${file.clientId}`} className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:border-erfor-green hover:text-erfor-green hover:shadow-sm transition shrink-0">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Expediente {file.internalCode}</h1>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                {file.type} • Autoridad: {file.authority}
              </p>
            </div>
          </div>
          
          <div className="flex gap-3 shrink-0">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm">
              <Settings className="h-4 w-4" /> Configuración
            </button>
          </div>
        </div>

        {/* Status Tracker */}
        <ExpedienteStatusTracker 
          fileId={file.id} 
          currentStatus={file.status} 
          onStatusUpdated={() => mutate()} 
        />

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
          {activeTab === "resumen" && (
            <div className="grid lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
              <div className="lg:col-span-2 space-y-6">
                {/* 1. Datos del Expediente */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                    <FileText className="h-5 w-5 text-erfor-green" />
                    <h3 className="font-bold text-slate-800 text-lg">1. Datos del Expediente</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Código / Expediente</p>
                      <p className="font-medium text-slate-800">{file.internalCode || "No definido"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Autoridad Ambiental</p>
                      <p className="font-medium text-slate-800">{file.authority || "No definida"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dirección Regional</p>
                      <p className="font-medium text-slate-800">{file.carRegional || "No definida"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Expediente</p>
                      <p className="font-medium text-slate-800">{file.type || "No definido"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nivel de Riesgo</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-700`}>
                        {file.riskLevel || "MEDIUM"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Datos del Cliente */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                    <Building2 className="h-5 w-5 text-erfor-green" />
                    <h3 className="font-bold text-slate-800 text-lg">2. Datos del Cliente</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Cliente</p>
                      <Link href={`/clientes/${file.clientId}`} className="font-medium text-erfor-green hover:underline">
                        {file.client?.name || "Desconocido"}
                      </Link>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Identificación (NIT/CC)</p>
                      <p className="font-medium text-slate-800">{file.client?.documentNumber || "No definida"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dirección</p>
                      <p className="font-medium text-slate-800">{file.client?.address || "No definida"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Teléfono</p>
                      <p className="font-medium text-slate-800">{file.client?.phone || "No definido"}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Datos de la Finca / Predio */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-3">
                    <MapPin className="h-5 w-5 text-erfor-green" />
                    <h3 className="font-bold text-slate-800 text-lg">3. Datos de la Finca / Predio</h3>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="sm:col-span-2">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre de la Finca</p>
                      <p className="font-medium text-slate-800">{file.property?.name || "Sin predio asignado"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cédula Catastral</p>
                      <p className="font-medium text-slate-800">{file.property?.cadastralCode || "No definida"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Matrícula Inmobiliaria</p>
                      <p className="font-medium text-slate-800">{file.property?.realEstateRegistration || "No definida"}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h3 className="font-bold text-slate-800 mb-4">Línea de Tiempo Legal</h3>
                  <ul className="space-y-4">
                    <li className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                        <Clock className="h-4 w-4 text-slate-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Fecha de Creación (Interna)</p>
                        <p className="text-sm font-medium text-slate-800">{new Date(file.createdAt).toLocaleDateString('es-CO')}</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Fecha de Radicación (Autoridad)</p>
                        <p className="text-sm font-medium text-slate-800">{file.filedAt ? new Date(file.filedAt).toLocaleDateString('es-CO') : "Pendiente"}</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <div className="h-8 w-8 rounded-full bg-orange-50 border border-orange-200 flex items-center justify-center shrink-0">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500">Próximo Vencimiento</p>
                        <p className="text-sm font-medium text-orange-700">{file.nextDeadline ? new Date(file.nextDeadline).toLocaleDateString('es-CO') : "No definido"}</p>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === "documentos" && (
            <div className="animate-in fade-in duration-300">
              <DocumentsModule 
                environmentalFileId={file.id} 
                initialDocuments={file.documents || []} 
              />
            </div>
          )}

          {activeTab === "obligaciones" && (
            <div className="animate-in fade-in duration-300">
              <ObligationsModule fileId={file.id} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
