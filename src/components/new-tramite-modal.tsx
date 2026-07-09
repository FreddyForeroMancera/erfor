"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, FilePlus2, Loader2, Info, Building2, Briefcase } from "lucide-react";
import useSWR, { useSWRConfig } from "swr";
import toast from "react-hot-toast";

interface NewTramiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
}

export function NewTramiteModal({ isOpen, onClose, clientId }: NewTramiteModalProps) {
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);
  
  // Fetch client data to get existing projects and properties
  const { data: clientData, isLoading: isLoadingClient } = useSWR(
    isOpen ? `/api/clients/${clientId}` : null,
    (url) => fetch(url).then((res) => res.json())
  );

  const projects = clientData?.client?.projects || [];
  const properties = clientData?.client?.properties || [];

  const [formData, setFormData] = useState({
    projectId: "",
    projectName: "",
    propertyId: "",
    propertyName: "",
    internalCode: "",
    type: "Licencia Ambiental",
    authority: "ANLA",
    carRegional: "",
    filedAt: "",
    nextDeadline: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validations
    if (formData.projectId === "NEW" && !formData.projectName.trim()) {
      toast.error("Debes ingresar un nombre para la nueva cotización");
      return;
    }
    if (formData.propertyId === "NEW" && !formData.propertyName.trim()) {
      toast.error("Debes ingresar un nombre para el nuevo predio");
      return;
    }
    if (!formData.projectId && formData.projectId !== "NEW") {
      toast.error("Debes seleccionar una cotización existente o crear una nueva");
      return;
    }
    if (!formData.propertyId && formData.propertyId !== "NEW") {
      toast.error("Debes seleccionar un predio existente o crear uno nuevo");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        clientId,
        projectId: formData.projectId === "NEW" ? undefined : formData.projectId,
        propertyId: formData.propertyId === "NEW" ? undefined : formData.propertyId,
      };

      const res = await fetch("/api/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear el trámite");

      toast.success("Trámite creado exitosamente");
      mutate(`/api/clients/${clientId}`);
      mutate(`/api/expedientes?clientId=${clientId}`);
      
      // Reset form
      setFormData({
        projectId: "",
        projectName: "",
        propertyId: "",
        propertyName: "",
        internalCode: "",
        type: "Licencia Ambiental",
        authority: "ANLA",
        carRegional: "",
        filedAt: "",
        nextDeadline: "",
      });
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
                  <Dialog.Title as="h3" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FilePlus2 className="h-5 w-5 text-erfor-green" />
                    Crear Nuevo Trámite
                  </Dialog.Title>
                  <button onClick={handleClose} disabled={loading} className="rounded-full p-1 hover:bg-slate-200 text-slate-500 transition disabled:opacity-50">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[75vh] overflow-y-auto">
                  
                  {/* SECCIÓN 1: PROYECTO / COTIZACIÓN */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <Briefcase className="h-5 w-5 text-indigo-600" />
                      <h4 className="font-bold text-slate-800">1. Cotización (Proyecto)</h4>
                    </div>
                    
                    <div className="space-y-4 pl-7">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Seleccionar Cotización <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                          value={formData.projectId}
                          onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                          disabled={loading || isLoadingClient}
                        >
                          <option value="">Seleccione una opción...</option>
                          {projects.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name} ({p.internalCode || 'Sin código'})</option>
                          ))}
                          <option value="NEW" className="font-bold text-erfor-green">
                            [+] Crear Nueva Cotización
                          </option>
                        </select>
                      </div>

                      {formData.projectId === "NEW" && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Nombre de la Nueva Cotización <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Asesoría Ambiental Licenciamiento 2026"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green bg-indigo-50"
                            value={formData.projectName}
                            onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN 2: PREDIO / UBICACIÓN */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <Building2 className="h-5 w-5 text-orange-600" />
                      <h4 className="font-bold text-slate-800">2. Predio / Ubicación</h4>
                    </div>
                    
                    <div className="space-y-4 pl-7">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Seleccionar Predio <span className="text-red-500">*</span>
                        </label>
                        <select
                          required
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                          value={formData.propertyId}
                          onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                          disabled={loading || isLoadingClient}
                        >
                          <option value="">Seleccione una opción...</option>
                          {properties.map((p: any) => (
                            <option key={p.id} value={p.id}>{p.name} {p.city ? `(${p.city})` : ''}</option>
                          ))}
                          <option value="NEW" className="font-bold text-erfor-green">
                            [+] Crear Nuevo Predio
                          </option>
                        </select>
                      </div>

                      {formData.propertyId === "NEW" && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Nombre del Nuevo Predio <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="Ej: Finca El Mirador"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green bg-orange-50"
                            value={formData.propertyName}
                            onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN 3: DETALLES DEL TRÁMITE */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <FilePlus2 className="h-5 w-5 text-erfor-green" />
                      <h4 className="font-bold text-slate-800">3. Detalles del Trámite (Expediente)</h4>
                    </div>

                    <div className="space-y-4 pl-7">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Código Interno (ERFOR) <span className="text-red-500">*</span>
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Ej: EXP-2026-001"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                            value={formData.internalCode}
                            onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                            disabled={loading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Tipo de Trámite <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            disabled={loading}
                          >
                            <option value="Licencia Ambiental">Licencia Ambiental</option>
                            <option value="Concesión de Aguas Superficiales">Concesión de Aguas Superficiales</option>
                            <option value="Concesión de Aguas Subterráneas">Concesión de Aguas Subterráneas</option>
                            <option value="Permiso de Vertimientos">Permiso de Vertimientos</option>
                            <option value="Permiso de Emisiones">Permiso de Emisiones</option>
                            <option value="Aprovechamiento Forestal">Aprovechamiento Forestal</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Autoridad Competente <span className="text-red-500">*</span>
                          </label>
                          <select
                            required
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                            value={formData.authority}
                            onChange={(e) => setFormData({ ...formData, authority: e.target.value })}
                            disabled={loading}
                          >
                            <option value="ANLA">ANLA</option>
                            <option value="CAR">CAR (Corporación Autónoma)</option>
                            <option value="SDA">SDA (Secretaría Distrital)</option>
                            <option value="MinAmbiente">MinAmbiente</option>
                          </select>
                        </div>

                        {formData.authority === "CAR" && (
                          <div className="animate-in fade-in zoom-in-95 duration-200">
                            <label className="block text-sm font-semibold text-slate-700 mb-1">
                              ¿Cuál CAR?
                            </label>
                            <input
                              type="text"
                              placeholder="Ej: CVC, Corantioquia..."
                              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                              value={formData.carRegional}
                              onChange={(e) => setFormData({ ...formData, carRegional: e.target.value })}
                              disabled={loading}
                            />
                          </div>
                        )}
                      </div>

                      {/* Fechas Clave */}
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Fecha de Radicación (Autoridad)
                          </label>
                          <input
                            type="date"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                            value={formData.filedAt}
                            onChange={(e) => setFormData({ ...formData, filedAt: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Próximo Vencimiento
                          </label>
                          <input
                            type="date"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                            value={formData.nextDeadline}
                            onChange={(e) => setFormData({ ...formData, nextDeadline: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={loading}
                      className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex items-center gap-2 rounded-lg bg-erfor-green px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50 shadow-sm"
                    >
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
                      Crear Trámite Completo
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
