"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Loader2, Check, FileText } from "lucide-react";
import toast from "react-hot-toast";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewClientModal({ isOpen, onClose, onSuccess }: NewClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [activationLink, setActivationLink] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      // Expediente Data
      expedienteCode: formData.get("expedienteCode"),
      authority: formData.get("authority"),
      regional: formData.get("regional"),
      expedienteType: formData.get("expedienteType"),
      
      // Client Data
      clientName: formData.get("clientName"),
      identification: formData.get("identification"),
      address: formData.get("address"),
      phone: formData.get("phone"),
      
      // Property Data
      propertyName: formData.get("propertyName"),
      cadastralCode: formData.get("cadastralCode"),
      realEstateRegistration: formData.get("realEstateRegistration"),
    };

    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al crear cliente y expediente");
      
      toast.success("Expediente creado con éxito");
      
      if (result.activationLink) {
        setActivationLink(result.activationLink);
      } else {
        onSuccess();
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    setActivationLink(null);
    onSuccess();
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {
        if (!loading && !activationLink) onClose();
      }}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
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
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white p-8 text-left align-middle shadow-xl transition-all">
                
                {activationLink ? (
                  // Success State
                  <div className="py-8">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6">
                      <Check className="h-8 w-8 text-green-600" />
                    </div>
                    <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-slate-800 text-center mb-4">
                      ¡Expediente Creado Exitosamente!
                    </Dialog.Title>
                    <p className="text-base text-slate-500 text-center mb-8 max-w-lg mx-auto">
                      Se ha configurado toda la estructura del proyecto en la base de datos (Cliente, Predio, Cotización y Expediente).
                    </p>
                    <button
                      onClick={handleFinish}
                      className="w-full max-w-xs mx-auto block bg-erfor-green text-white font-medium py-3 rounded-lg hover:bg-green-700 transition"
                    >
                      Terminar y Cerrar
                    </button>
                  </div>
                ) : (
                  // Form State
                  <>
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
                      <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-800 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-erfor-green" />
                        Nuevo Expediente Ambiental
                      </Dialog.Title>
                      <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-full p-2 hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-10">
                      
                      {/* 1. Datos del Expediente */}
                      <div>
                        <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-50">1. Datos del Expediente</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Código / Expediente <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              name="expedienteCode"
                              required
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder="Ej. EXP-2026-001"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Autoridad Ambiental <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              name="authority"
                              required
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder="Ej. CAR"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Dirección Regional</label>
                            <select 
                              name="regional" 
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm bg-white"
                            >
                              <option value="">Seleccione una regional...</option>
                              <option value="Bogotá">Bogotá</option>
                              <option value="Cundinamarca">Cundinamarca</option>
                              <option value="Boyacá">Boyacá</option>
                              <option value="Antioquia">Antioquia</option>
                              <option value="Valle del Cauca">Valle del Cauca</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Expediente</label>
                            <select 
                              name="expedienteType" 
                              className="w-full px-3 py-2 border-erfor-green border-2 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm bg-white text-slate-800"
                            >
                              <option value="Permisivo">Permisivo</option>
                              <option value="Sancionatorio">Sancionatorio</option>
                              <option value="Control y Seguimiento">Control y Seguimiento</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* 2. Datos del Cliente */}
                      <div>
                        <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-50">2. Datos del Cliente</h4>
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre Cliente <span className="text-red-500">*</span></label>
                            <input
                              type="text"
                              name="clientName"
                              required
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder="Nombre de la empresa o persona"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Identificación (NIT/CC)</label>
                            <input
                              type="text"
                              name="identification"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder=""
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Dirección</label>
                            <input
                              type="text"
                              name="address"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder=""
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Teléfono</label>
                            <input
                              type="tel"
                              name="phone"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder=""
                            />
                          </div>
                        </div>
                      </div>

                      {/* 3. Datos de la Finca / Predio */}
                      <div>
                        <h4 className="font-bold text-slate-800 mb-4 pb-2 border-b border-slate-50">3. Datos de la Finca / Predio</h4>
                        <div className="grid grid-cols-3 gap-6">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre de la Finca</label>
                            <input
                              type="text"
                              name="propertyName"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder="Nombre del predio"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Cédula Catastral</label>
                            <input
                              type="text"
                              name="cadastralCode"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder=""
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Matrícula Inmobiliaria</label>
                            <input
                              type="text"
                              name="realEstateRegistration"
                              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder=""
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-6 mt-8 border-t border-slate-100 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          disabled={loading}
                          className="px-6 py-2.5 rounded-md text-slate-600 font-semibold hover:bg-slate-100 transition disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-2 bg-erfor-green text-white px-8 py-2.5 rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-70 shadow-md"
                        >
                          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                          {loading ? "Guardando..." : "Crear Expediente"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
