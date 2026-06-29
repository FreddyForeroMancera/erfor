"use client";

import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, Building2, User, Mail, Hash, Phone, Loader2, Copy, Check } from "lucide-react";
import toast from "react-hot-toast";

interface NewClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewClientModal({ isOpen, onClose, onSuccess }: NewClientModalProps) {
  const [loading, setLoading] = useState(false);
  const [activationLink, setActivationLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name"),
      documentType: formData.get("documentType") || "NIT",
      documentNumber: formData.get("documentNumber"),
      contactPerson: formData.get("contactPerson"),
      email: formData.get("email"),
      phone: formData.get("phone"),
    };

    setLoading(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Error al crear cliente");
      
      toast.success("Cliente creado con éxito");
      
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

  const copyToClipboard = () => {
    if (activationLink) {
      navigator.clipboard.writeText(activationLink);
      setCopied(true);
      toast.success("Enlace copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                
                {activationLink ? (
                  // Success State - Show Activation Link
                  <div className="py-6">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 mb-4">
                      <Check className="h-6 w-6 text-green-600" />
                    </div>
                    <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-800 text-center mb-2">
                      ¡Cliente Creado Exitosamente!
                    </Dialog.Title>
                    <p className="text-sm text-slate-500 text-center mb-6">
                      El sistema ha generado un enlace mágico de activación. Cópialo y envíaselo a tu cliente para que establezca su contraseña.
                    </p>
                    
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6 flex flex-col items-center">
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Enlace de Activación</p>
                      <code className="text-sm text-erfor-green font-mono break-all text-center mb-4 px-2">
                        {activationLink}
                      </code>
                      <button
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 bg-white border border-slate-300 shadow-sm text-slate-700 px-4 py-2 rounded-md hover:bg-slate-50 transition text-sm font-medium"
                      >
                        {copied ? <Check className="h-4 w-4 text-erfor-green" /> : <Copy className="h-4 w-4" />}
                        {copied ? "¡Copiado!" : "Copiar Enlace"}
                      </button>
                    </div>

                    <button
                      onClick={handleFinish}
                      className="w-full bg-erfor-green text-white font-medium py-2.5 rounded-lg hover:bg-green-700 transition"
                    >
                      Terminar y Cerrar
                    </button>
                  </div>
                ) : (
                  // Form State
                  <>
                    <div className="flex items-center justify-between mb-5">
                      <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-slate-800 flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-erfor-green" />
                        Registrar Nuevo Cliente
                      </Dialog.Title>
                      <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-full p-1 hover:bg-slate-100 transition text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                      
                      {/* Empresa */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Empresa / Cliente</label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            name="name"
                            required
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                            placeholder="Ej. Empresa Verde S.A.S"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-1">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Doc.</label>
                          <select 
                            name="documentType" 
                            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                          >
                            <option value="NIT">NIT</option>
                            <option value="CC">C.C.</option>
                            <option value="CE">C.E.</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Número de Documento</label>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="text"
                              name="documentNumber"
                              required
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder="Sin puntos ni guiones"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contacto */}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Persona de Contacto</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            name="contactPerson"
                            required
                            className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                            placeholder="Nombre del representante"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="email"
                              name="email"
                              required
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder="contacto@empresa.com"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono Móvil</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                              type="tel"
                              name="phone"
                              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-erfor-green focus:border-erfor-green text-sm"
                              placeholder="Opcional"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={onClose}
                          disabled={loading}
                          className="px-4 py-2 rounded-md text-slate-600 font-medium hover:bg-slate-100 transition disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-2 bg-erfor-green text-white px-5 py-2 rounded-md font-medium hover:bg-green-700 transition disabled:opacity-70 shadow-sm"
                        >
                          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                          {loading ? "Creando..." : "Crear Cliente"}
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
