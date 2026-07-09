"use client";

import { useState, use, Fragment } from "react";
import useSWR, { useSWRConfig } from "swr";
import { fetcher } from "@/lib/fetcher";
import { AppShell } from "@/components/app-shell";
import { FilesModule } from "@/components/files-module";
import { Building2, Map, FolderKanban, Loader2, ArrowLeft, Mail, Phone, MapPin, Calendar, Clock, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { NewTramiteModal } from "@/components/new-tramite-modal";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data, error, isLoading, mutate } = useSWR<any>(`/api/clients/${resolvedParams.id}`, fetcher);
  const [activeTab, setActiveTab] = useState<"info" | "expedientes" | "proyectos">("info");
  const [isNewTramiteOpen, setIsNewTramiteOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

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
  const filesCount = client._count?.files || 0;

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
            <button 
              onClick={() => {
                setEditForm({
                  name: client.name || "",
                  documentType: client.documentType || "NIT",
                  documentNumber: client.documentNumber || "",
                  email: client.email || "",
                  phone: client.phone || "",
                  address: client.address || "",
                  city: client.city || "",
                  department: client.department || "",
                  representative: client.representative || "",
                  notes: client.notes || "",
                });
                setIsEditModalOpen(true);
              }}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition shadow-sm"
            >
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

      {/* Modal Editar Cliente */}
      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => !isSaving && setIsEditModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                  {/* Header */}
                  <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-erfor-mist flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-erfor-green" />
                      </div>
                      <div>
                        <Dialog.Title className="font-bold text-slate-800 text-lg">Editar Cliente</Dialog.Title>
                        <p className="text-xs text-slate-500">{client.name}</p>
                      </div>
                    </div>
                    <button onClick={() => setIsEditModalOpen(false)} disabled={isSaving} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition">
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSaving(true);
                    try {
                      const res = await fetch(`/api/clients/${resolvedParams.id}`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(editForm),
                      });
                      if (!res.ok) throw new Error("Error al guardar");
                      toast.success("Cliente actualizado correctamente");
                      mutate();
                      setIsEditModalOpen(false);
                    } catch {
                      toast.error("No se pudo guardar el cliente");
                    } finally {
                      setIsSaving(false);
                    }
                  }} className="p-6 space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre / Razón Social *</label>
                        <input required value={editForm.name || ""} onChange={e => setEditForm((f: any) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green focus:ring-1 focus:ring-erfor-green" placeholder="Nombre completo o razón social" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tipo de Documento</label>
                        <select value={editForm.documentType || "NIT"} onChange={e => setEditForm((f: any) => ({ ...f, documentType: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green bg-white">
                          <option value="NIT">NIT</option>
                          <option value="CC">Cédula de Ciudadanía</option>
                          <option value="CE">Cédula de Extranjería</option>
                          <option value="PAS">Pasaporte</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Número de Identificación</label>
                        <input value={editForm.documentNumber || ""} onChange={e => setEditForm((f: any) => ({ ...f, documentNumber: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" placeholder="Ej. 900.123.456-1" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Representante Legal</label>
                        <input value={editForm.representative || ""} onChange={e => setEditForm((f: any) => ({ ...f, representative: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" placeholder="Nombre del representante" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                        <input type="email" value={editForm.email || ""} onChange={e => setEditForm((f: any) => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" placeholder="correo@empresa.com" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                        <input value={editForm.phone || ""} onChange={e => setEditForm((f: any) => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" placeholder="+57 300 123 4567" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Dirección</label>
                        <input value={editForm.address || ""} onChange={e => setEditForm((f: any) => ({ ...f, address: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" placeholder="Calle, Carrera, etc." />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Ciudad</label>
                        <input value={editForm.city || ""} onChange={e => setEditForm((f: any) => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" placeholder="Bogotá" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Departamento</label>
                        <input value={editForm.department || ""} onChange={e => setEditForm((f: any) => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green" placeholder="Cundinamarca" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Notas Internas</label>
                        <textarea rows={3} value={editForm.notes || ""} onChange={e => setEditForm((f: any) => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green resize-none" placeholder="Observaciones internas del consultor..." />
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                      <button type="button" onClick={() => setIsEditModalOpen(false)} disabled={isSaving} className="px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition">
                        Cancelar
                      </button>
                      <button type="submit" disabled={isSaving} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-erfor-green text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60">
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
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
    </AppShell>
  );
}
