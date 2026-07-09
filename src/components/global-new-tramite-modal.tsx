"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition, Combobox } from "@headlessui/react";
import { X, FilePlus2, Loader2, Briefcase, Building2, UserCircle, Check } from "lucide-react";
import toast from "react-hot-toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function GlobalNewTramiteModal({ isOpen, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    clientName: "",
    projectName: "",
    propertyName: "",
    internalCode: "",
    type: "Licencia Ambiental",
    authority: "ANLA",
    carRegional: "",
    filedAt: "",
    nextDeadline: "",
  });

  useEffect(() => {
    if (isOpen) {
      fetch("/api/clients")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.items) {
            setClients(data.items);
          }
        })
        .catch(console.error);
    }
  }, [isOpen]);

  const filteredClients =
    query === ""
      ? clients
      : clients.filter((client) =>
          client.name
            .toLowerCase()
            .replace(/\s+/g, "")
            .includes(query.toLowerCase().replace(/\s+/g, ""))
        );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient && !formData.clientName.trim()) {
      toast.error("Debes seleccionar un cliente o crear uno nuevo");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        clientId: selectedClient?.id,
      };

      const res = await fetch("/api/cotizaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al crear el trámite");

      toast.success("Cotización / Trámite creado exitosamente");
      onSuccess();
      
      // Reset
      setSelectedClient(null);
      setFormData({
        clientName: "",
        projectName: "",
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
                    Nueva Cotización / Trámite
                  </Dialog.Title>
                  <button onClick={handleClose} disabled={loading} className="rounded-full p-1 hover:bg-slate-200 text-slate-500 transition disabled:opacity-50">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 max-h-[75vh] overflow-y-auto">
                  
                  {/* SECCIÓN 1: CLIENTE */}
                  <div className="mb-8">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <UserCircle className="h-5 w-5 text-blue-600" />
                      <h4 className="font-bold text-slate-800">1. Cliente</h4>
                    </div>
                    <div className="pl-7 space-y-4">
                      <div className="relative z-20">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">
                          Seleccionar Cliente Existente
                        </label>
                        <Combobox value={selectedClient} onChange={setSelectedClient}>
                          <div className="relative mt-1">
                            <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left border border-slate-300 focus-within:ring-1 focus-within:ring-erfor-green focus-within:border-erfor-green sm:text-sm">
                              <Combobox.Input
                                className="w-full border-none py-2 pl-3 pr-10 text-sm leading-5 text-slate-900 focus:ring-0 outline-none"
                                displayValue={(client: any) => client?.name || ""}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Buscar cliente..."
                                disabled={loading}
                              />
                            </div>
                            <Transition
                              as={Fragment}
                              leave="transition ease-in duration-100"
                              leaveFrom="opacity-100"
                              leaveTo="opacity-0"
                              afterLeave={() => setQuery("")}
                            >
                              <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
                                {filteredClients.length === 0 && query !== "" ? (
                                  <div className="relative cursor-default select-none px-4 py-2 text-slate-700">
                                    No se encontró nada.
                                  </div>
                                ) : (
                                  filteredClients.map((client) => (
                                    <Combobox.Option
                                      key={client.id}
                                      className={({ active }) =>
                                        `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                                          active ? "bg-erfor-green text-white" : "text-slate-900"
                                        }`
                                      }
                                      value={client}
                                    >
                                      {({ selected, active }) => (
                                        <>
                                          <span className={`block truncate ${selected ? "font-medium" : "font-normal"}`}>
                                            {client.name}
                                          </span>
                                          {selected ? (
                                            <span className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? "text-white" : "text-erfor-green"}`}>
                                              <Check className="h-5 w-5" aria-hidden="true" />
                                            </span>
                                          ) : null}
                                        </>
                                      )}
                                    </Combobox.Option>
                                  ))
                                )}
                              </Combobox.Options>
                            </Transition>
                          </div>
                        </Combobox>
                      </div>

                      {!selectedClient && (
                        <div className="animate-in fade-in zoom-in-95 duration-200">
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            O crear Nuevo Cliente
                          </label>
                          <input
                            type="text"
                            placeholder="Nombre de la nueva empresa / cliente"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green bg-blue-50"
                            value={formData.clientName}
                            onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* SECCIÓN 2: COTIZACIÓN */}
                  <div className="mb-8 relative z-10">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <Briefcase className="h-5 w-5 text-indigo-600" />
                      <h4 className="font-bold text-slate-800">2. Cotización (Proyecto)</h4>
                    </div>
                    <div className="pl-7">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Nombre de la Cotización <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Asesoría Ambiental Licenciamiento 2026"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                        value={formData.projectName}
                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* SECCIÓN 3: PREDIO */}
                  <div className="mb-8 relative z-0">
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <Building2 className="h-5 w-5 text-orange-600" />
                      <h4 className="font-bold text-slate-800">3. Ubicación Falsa / Predio</h4>
                    </div>
                    <div className="pl-7">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">
                        Nombre del Predio <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ej: Finca El Mirador"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                        value={formData.propertyName}
                        onChange={(e) => setFormData({ ...formData, propertyName: e.target.value })}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* SECCIÓN 4: TRÁMITE */}
                  <div>
                    <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-2">
                      <FilePlus2 className="h-5 w-5 text-erfor-green" />
                      <h4 className="font-bold text-slate-800">4. Detalles del Trámite</h4>
                    </div>

                    <div className="space-y-4 pl-7">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Código Interno (Cotización) <span className="text-red-500">*</span>
                          </label>
                          <input
                            required
                            type="text"
                            placeholder="Ej: COT-2026-001"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green"
                            value={formData.internalCode}
                            onChange={(e) => setFormData({ ...formData, internalCode: e.target.value })}
                            disabled={loading}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">
                            Tipo de Trámite Principal <span className="text-red-500">*</span>
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
                      Crear Cotización
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
