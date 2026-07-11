"use client";

import { useState, use, Fragment } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { AppShell } from "@/components/app-shell";
import { ArrowLeft, Loader2, FileText, CheckCircle2, Clock, AlertTriangle, Cloud, Settings, Building2, MapPin, Pencil, X, Sparkles, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import { DocumentsModule } from "@/components/documents-module";
import { ObligationsModule } from "@/components/obligations-module";
import { ConsumptionReportsModule } from "@/components/consumption-reports-module";
import { PueaaModule } from "@/components/pueaa-module";
import { ExpedienteStatusTracker } from "@/components/expediente-status-tracker";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";

export default function ExpedienteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { data: file, error, isLoading, mutate } = useSWR<any>(`/api/expedientes/${resolvedParams.id}`, fetcher);
  
  const { data: userData } = useSWR<any>("/api/auth/me", fetcher);
  const currentUser = userData?.user;
  const canDeleteUser = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "DIRECTOR_AMBIENTAL";

  const { data: clientData } = useSWR<any>(
    file?.clientId ? `/api/clients/${file.clientId}` : null,
    fetcher
  );
  const clientProjects = clientData?.client?.projects || [];

  const [activeTab, setActiveTab] = useState<"resumen" | "documentos" | "obligaciones">("resumen");
  const [showNewProjectField, setShowNewProjectField] = useState(false);
  const [isEditFileModalOpen, setIsEditFileModalOpen] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [fileEditForm, setFileEditForm] = useState<any>({});
  const [isPropertyModalOpen, setIsPropertyModalOpen] = useState(false);
  const [isSavingProperty, setIsSavingProperty] = useState(false);
  const [propertyForm, setPropertyForm] = useState<any>({});
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [clientEditForm, setClientEditForm] = useState<any>({});
  const [isReanalyzing, setIsReanalyzing] = useState(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteFile = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/expedientes/${file.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Error al eliminar el expediente");
      toast.success("Expediente eliminado correctamente");
      setIsDeleteModalOpen(false);
      router.push(`/clientes/${file.clientId}`);
    } catch (err: any) {
      toast.error(err.message || "No se pudo eliminar el expediente");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReanalyze = async () => {
    setIsReanalyzing(true);
    const toastId = toast.loading("Re-analizando documentos con IA...");
    try {
      const res = await fetch(`/api/expedientes/${resolvedParams.id}/reanalyze`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Error al re-analizar");
      if (data.property) {
        toast.success(`Predio detectado: ${data.property.name}`, { id: toastId, duration: 6000 });
      } else if (data.analyzedDocuments === 0) {
        toast.error(data.message || "No hay documentos con texto analizable todavía.", { id: toastId, duration: 8000 });
      } else {
        toast(`Se analizaron ${data.analyzedDocuments} documento(s) pero la IA no encontró un predio claro. Puedes cargarlo a mano.`, { id: toastId, duration: 8000 });
      }
      mutate();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo re-analizar", { id: toastId, duration: 8000 });
    } finally {
      setIsReanalyzing(false);
    }
  };

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

  const baseTabs = [
    { id: "resumen", label: "Resumen General", icon: FileText },
    { id: "documentos", label: `Documentos Soportes (${file.documents?.length || 0})`, icon: Cloud },
  ] as const;

  const tabs = (file.status === "APPROVED" || file.status === "COMPLETED")
    ? [...baseTabs, { id: "obligaciones", label: "Obligaciones & Tareas", icon: CheckCircle2 }]
    : baseTabs;

  if (activeTab === "obligaciones" && (file.status !== "APPROVED" && file.status !== "COMPLETED")) {
    setActiveTab("resumen");
  }



  return (
    <AppShell>
      <div className="p-4 lg:p-8 pb-24 lg:pb-28 max-w-7xl mx-auto">
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
            <button
              onClick={handleReanalyze}
              disabled={isReanalyzing}
              className="flex items-center gap-2 px-4 py-2 bg-erfor-green text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition shadow-sm disabled:opacity-60"
              title="Vuelve a analizar con IA los documentos ya subidos para detectar predio, propietario y representante"
            >
              {isReanalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {isReanalyzing ? "Analizando..." : "Re-analizar con IA"}
            </button>
            <button
              onClick={() => {
                setFileEditForm({
                  internalCode: file.internalCode || "",
                  officialCode: file.officialCode || "",
                  authority: file.authority || "",
                  carRegional: file.carRegional || "",
                  type: file.type || "",
                  priority: file.priority || "MEDIUM",
                  riskLevel: file.riskLevel || "MEDIUM",
                  openedAt: file.openedAt ? file.openedAt.slice(0, 10) : "",
                  filedAt: file.filedAt ? file.filedAt.slice(0, 10) : "",
                  nextDeadline: file.nextDeadline ? file.nextDeadline.slice(0, 10) : "",
                  description: file.description || "",
                  timeline: file.timeline || "",
                  status: file.status || "DRAFT",
                  projectId: file.projectId || "NONE",
                });
                setShowNewProjectField(false);
                setIsEditFileModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
              <Settings className="h-4 w-4" /> Configuración
            </button>
            {canDeleteUser && (
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-100 hover:border-red-300 transition shadow-sm"
              >
                <Trash2 className="h-4 w-4" /> Eliminar
              </button>
            )}
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
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Prioridad</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${file.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                        {file.priority || "MEDIUM"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Datos del Cliente */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mt-6">
                  <div className="flex items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-erfor-green" />
                      <h3 className="font-bold text-slate-800 text-lg">2. Datos del Cliente</h3>
                    </div>
                    <button
                      onClick={() => {
                        setClientEditForm({
                          name: file.client?.name || "",
                          documentType: file.client?.documentType || "NIT",
                          documentNumber: file.client?.documentNumber || "",
                          email: file.client?.email || "",
                          phone: file.client?.phone || "",
                          address: file.client?.address || "",
                          city: file.client?.city || "",
                          department: file.client?.department || "",
                          representative: file.client?.representative || "",
                        });
                        setIsEditClientModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-erfor-green border border-erfor-green/30 rounded-lg hover:bg-erfor-mist transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Editar Cliente
                    </button>
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
                  <div className="flex items-center justify-between gap-2 mb-6 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-erfor-green" />
                      <h3 className="font-bold text-slate-800 text-lg">3. Datos de la Finca / Predio</h3>
                    </div>
                    <button
                      onClick={() => {
                        setPropertyForm({
                          name: file.property?.name || "",
                          cadastralCode: file.property?.cadastralCode || "",
                          realEstateRegistration: file.property?.realEstateRegistration || "",
                          owner: file.property?.owner || "",
                          address: file.property?.address || "",
                          city: file.property?.city || "",
                          department: file.property?.department || "",
                          village: file.property?.village || "",
                        });
                        setIsPropertyModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-erfor-green border border-erfor-green/30 rounded-lg hover:bg-erfor-mist transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      {file.property ? "Editar Predio" : "Asignar Predio"}
                    </button>
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
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Propietario</p>
                      <p className="font-medium text-slate-800">{file.property?.owner || "No definido"}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Dirección</p>
                      <p className="font-medium text-slate-800">{file.property?.address || "No definida"}</p>
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
                clientId={file.clientId}
                initialDocuments={file.documents || []}
              />
            </div>
          )}

          {activeTab === "obligaciones" && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <ObligationsModule fileId={file.id} />
              
              {file.status === "COMPLETED" && (
                <>
                  <ConsumptionReportsModule fileId={file.id} />
                  <PueaaModule fileId={file.id} />
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Editar Expediente */}
      <Transition appear show={isEditFileModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isSavingFile && setIsEditFileModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-erfor-mist flex items-center justify-center">
                        <FileText className="h-5 w-5 text-erfor-green" />
                      </div>
                      <div>
                        <Dialog.Title className="font-bold text-slate-800 text-lg">Editar Expediente</Dialog.Title>
                        <p className="text-xs text-slate-500">{file.internalCode}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsEditFileModalOpen(false)} disabled={isSavingFile} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSavingFile(true);
                    try {
                      const res = await fetch(`/api/expedientes/${file.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(fileEditForm),
                      });
                      if (!res.ok) throw new Error("Error al guardar");
                      toast.success("Expediente actualizado correctamente");
                      mutate();
                      setIsEditFileModalOpen(false);
                    } catch {
                      toast.error("No se pudo guardar el expediente");
                    } finally {
                      setIsSavingFile(false);
                    }
                  }} className="p-6 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Código Interno *</label>
                        <input required value={fileEditForm.internalCode || ""} onChange={e => setFileEditForm((f: any) => ({ ...f, internalCode: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green focus:ring-1 focus:ring-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Código Oficial (Autoridad)</label>
                        <input value={fileEditForm.officialCode || ""} onChange={e => setFileEditForm((f: any) => ({ ...f, officialCode: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Autoridad Ambiental</label>
                        <input value={fileEditForm.authority || ""} onChange={e => setFileEditForm((f: any) => ({ ...f, authority: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" placeholder="Ej. CAR Cundinamarca" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dirección Regional</label>
                        <input value={fileEditForm.carRegional || ""} onChange={e => setFileEditForm((f: any) => ({ ...f, carRegional: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Expediente</label>
                        <input value={fileEditForm.type || ""} onChange={e => setFileEditForm((f: any) => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" placeholder="Ej. Concesión de aguas" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nivel de Riesgo</label>
                        <select value={fileEditForm.riskLevel || "MEDIUM"} onChange={e => setFileEditForm((f: any) => ({ ...f, riskLevel: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green bg-white">
                          <option value="LOW">Bajo</option>
                          <option value="MEDIUM">Medio</option>
                          <option value="HIGH">Alto</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Prioridad</label>
                        <select value={fileEditForm.priority || "MEDIUM"} onChange={e => setFileEditForm((f: any) => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green bg-white">
                          <option value="LOW">Baja</option>
                          <option value="MEDIUM">Media</option>
                          <option value="HIGH">Alta</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha de Apertura</label>
                        <input type="date" value={fileEditForm.openedAt || ""} onChange={e => setFileEditForm((f: any) => ({ ...f, openedAt: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha de Radicación (Autoridad)</label>
                        <input type="date" value={fileEditForm.filedAt || ""} onChange={e => setFileEditForm((f: any) => ({ ...f, filedAt: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Próximo Vencimiento</label>
                        <input type="date" value={fileEditForm.nextDeadline || ""} onChange={e => setFileEditForm((f: any) => ({ ...f, nextDeadline: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descripción</label>
                        <textarea rows={3} value={fileEditForm.description || ""} onChange={e => setFileEditForm((f: any) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green resize-none" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Línea de Tiempo / Notas de Seguimiento</label>
                        <textarea rows={3} value={fileEditForm.timeline || ""} onChange={e => setFileEditForm((f: any) => ({ ...f, timeline: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green resize-none" />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fase / Estado *</label>
                        <select 
                          required
                          value={fileEditForm.status || "DRAFT"} 
                          onChange={e => setFileEditForm((f: any) => ({ ...f, status: e.target.value }))} 
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green bg-white"
                        >
                          <option value="DRAFT">Cotización (Borrador)</option>
                          <option value="PREPARATION">En Proceso (Preparación y Revisión)</option>
                          <option value="EVALUATION">En Trámite (Ante autoridades)</option>
                          <option value="APPROVED">Otorgado (Permisos y Licencias)</option>
                          <option value="COMPLETED">En Seguimiento (Vigilancia de Obligaciones)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Proyecto Asociado</label>
                        <select 
                          value={fileEditForm.projectId || (showNewProjectField ? "NEW" : "NONE")}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "NEW") {
                              setShowNewProjectField(true);
                              setFileEditForm((f: any) => ({ ...f, projectId: undefined }));
                            } else {
                              setShowNewProjectField(false);
                              setFileEditForm((f: any) => ({ ...f, projectId: val === "NONE" ? "NONE" : val, newProjectName: undefined }));
                            }
                          }}
                          className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green bg-white"
                        >
                          <option value="NONE">Sin proyecto asociado</option>
                          {clientProjects.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                          <option value="NEW" className="text-erfor-green font-semibold">+ Crear nuevo proyecto...</option>
                        </select>
                      </div>

                      {showNewProjectField && (
                        <div className="sm:col-span-2">
                           <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre del Nuevo Proyecto *</label>
                           <input 
                             type="text"
                             required
                             placeholder="Escribe el nombre del nuevo proyecto"
                             value={fileEditForm.newProjectName || ""}
                             onChange={(e) => setFileEditForm((f: any) => ({ ...f, newProjectName: e.target.value }))}
                             className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green"
                           />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <div>
                        {canDeleteUser && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsEditFileModalOpen(false);
                              setIsDeleteModalOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar Expediente
                          </button>
                        )}
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => setIsEditFileModalOpen(false)} disabled={isSavingFile} className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                          Cancelar
                        </button>
                        <button type="submit" disabled={isSavingFile} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-erfor-green text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                          {isSavingFile && <Loader2 className="h-4 w-4 animate-spin" />}
                          Guardar Cambios
                        </button>
                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Editar / Asignar Predio */}
      <Transition appear show={isPropertyModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isSavingProperty && setIsPropertyModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-erfor-mist flex items-center justify-center">
                        <MapPin className="h-5 w-5 text-erfor-green" />
                      </div>
                      <div>
                        <Dialog.Title className="font-bold text-slate-800 text-lg">{file.property ? "Editar Predio" : "Asignar Predio"}</Dialog.Title>
                        <p className="text-xs text-slate-500">Expediente {file.internalCode}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsPropertyModalOpen(false)} disabled={isSavingProperty} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSavingProperty(true);
                    try {
                      if (file.property) {
                        const res = await fetch(`/api/properties/${file.property.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(propertyForm),
                        });
                        if (!res.ok) throw new Error("Error al guardar");
                      } else {
                        const createRes = await fetch(`/api/properties`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ ...propertyForm, clientId: file.clientId }),
                        });
                        if (!createRes.ok) throw new Error("Error al crear el predio");
                        const created = await createRes.json();
                        const linkRes = await fetch(`/api/environmentalFiles/${file.id}`, {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ propertyId: created.item.id }),
                        });
                        if (!linkRes.ok) throw new Error("Error al vincular el predio al expediente");
                      }
                      toast.success("Predio guardado correctamente");
                      mutate();
                      setIsPropertyModalOpen(false);
                    } catch {
                      toast.error("No se pudo guardar el predio");
                    } finally {
                      setIsSavingProperty(false);
                    }
                  }} className="p-6 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre de la Finca / Predio *</label>
                        <input required value={propertyForm.name || ""} onChange={e => setPropertyForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green focus:ring-1 focus:ring-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Cédula Catastral</label>
                        <input value={propertyForm.cadastralCode || ""} onChange={e => setPropertyForm((f: any) => ({ ...f, cadastralCode: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Matrícula Inmobiliaria</label>
                        <input value={propertyForm.realEstateRegistration || ""} onChange={e => setPropertyForm((f: any) => ({ ...f, realEstateRegistration: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Propietario</label>
                        <input value={propertyForm.owner || ""} onChange={e => setPropertyForm((f: any) => ({ ...f, owner: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Vereda</label>
                        <input value={propertyForm.village || ""} onChange={e => setPropertyForm((f: any) => ({ ...f, village: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dirección</label>
                        <input value={propertyForm.address || ""} onChange={e => setPropertyForm((f: any) => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Municipio</label>
                        <input value={propertyForm.city || ""} onChange={e => setPropertyForm((f: any) => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Departamento</label>
                        <input value={propertyForm.department || ""} onChange={e => setPropertyForm((f: any) => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                      <button type="button" onClick={() => setIsPropertyModalOpen(false)} disabled={isSavingProperty} className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        Cancelar
                      </button>
                      <button type="submit" disabled={isSavingProperty} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-erfor-green text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                        {isSavingProperty && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Modal Editar Cliente */}
      <Transition appear show={isEditClientModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isSavingClient && setIsEditClientModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-erfor-mist flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-erfor-green" />
                      </div>
                      <div>
                        <Dialog.Title className="font-bold text-slate-800 text-lg">Editar Cliente</Dialog.Title>
                        <p className="text-xs text-slate-500">{file.client?.name}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsEditClientModalOpen(false)} disabled={isSavingClient} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSavingClient(true);
                    try {
                      const res = await fetch(`/api/clients/${file.clientId}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(clientEditForm),
                      });
                      if (!res.ok) throw new Error("Error al guardar");
                      toast.success("Cliente actualizado correctamente");
                      mutate();
                      setIsEditClientModalOpen(false);
                    } catch {
                      toast.error("No se pudo guardar el cliente");
                    } finally {
                      setIsSavingClient(false);
                    }
                  }} className="p-6 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre / Razón Social *</label>
                        <input required value={clientEditForm.name || ""} onChange={e => setClientEditForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green focus:ring-1 focus:ring-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Documento</label>
                        <select value={clientEditForm.documentType || "NIT"} onChange={e => setClientEditForm((f: any) => ({ ...f, documentType: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green bg-white">
                          <option value="NIT">NIT</option>
                          <option value="CC">Cédula de Ciudadanía</option>
                          <option value="CE">Cédula de Extranjería</option>
                          <option value="PAS">Pasaporte</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Número de Identificación</label>
                        <input value={clientEditForm.documentNumber || ""} onChange={e => setClientEditForm((f: any) => ({ ...f, documentNumber: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" placeholder="Ej. 900.123.456-1" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Representante Legal</label>
                        <input value={clientEditForm.representative || ""} onChange={e => setClientEditForm((f: any) => ({ ...f, representative: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                        <input type="email" value={clientEditForm.email || ""} onChange={e => setClientEditForm((f: any) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                        <input value={clientEditForm.phone || ""} onChange={e => setClientEditForm((f: any) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dirección</label>
                        <input value={clientEditForm.address || ""} onChange={e => setClientEditForm((f: any) => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ciudad</label>
                        <input value={clientEditForm.city || ""} onChange={e => setClientEditForm((f: any) => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Departamento</label>
                        <input value={clientEditForm.department || ""} onChange={e => setClientEditForm((f: any) => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                      <button type="button" onClick={() => setIsEditClientModalOpen(false)} disabled={isSavingClient} className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        Cancelar
                      </button>
                      <button type="submit" disabled={isSavingClient} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-erfor-green text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                        {isSavingClient && <Loader2 className="h-4 w-4 animate-spin" />}
                        Guardar Cambios
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteFile}
        itemName={file.internalCode}
        title="Eliminar Expediente"
        isDeleting={isDeleting}
        requireDoubleConfirmation={true}
        doubleConfirmationLabel="Entiendo que al eliminar este expediente se desvincularán todos sus trámites, requerimientos y obligaciones, y esta acción no se puede deshacer."
      />
    </AppShell>
  );
}
