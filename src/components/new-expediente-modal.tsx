"use client";

import { useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { X, FolderKanban, Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

const CAR_REGIONS = [
  "Regional Sabana Centro",
  "Regional Bogotá - La Calera",
  "Regional Soacha",
  "Regional Almeidas y Guatavita",
  "Regional Alto Magdalena",
  "Regional Bajo Magdalena",
  "Regional Chiquinquirá",
  "Regional Gualivá",
  "Regional Magdalena Centro",
  "Regional Rionegro",
  "Regional Sabana Occidente",
  "Regional Sumapaz",
  "Regional Tequendama",
  "Regional Ubaté"
];

interface NewExpedienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewExpedienteModal({ isOpen, onClose, onSuccess }: NewExpedienteModalProps) {
  const [loading, setLoading] = useState(false);
  
  // Expediente
  const [internalCode, setInternalCode] = useState("");
  const [authority, setAuthority] = useState("CAR");
  const [carRegional, setCarRegional] = useState("");
  const [type, setType] = useState("PERMISIVO");
  
  // Cliente
  const [clientName, setClientName] = useState("");
  const [clientType, setClientType] = useState("JURIDICA");
  const [clientDocumentType, setClientDocumentType] = useState("NIT");
  const [clientDocument, setClientDocument] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [propertyAdminName, setPropertyAdminName] = useState("");
  const [propertyAdminPhone, setPropertyAdminPhone] = useState("");
  const [rutFile, setRutFile] = useState<File | null>(null);

  // Predio
  const [propertyName, setPropertyName] = useState("");
  const [propertyCadastral, setPropertyCadastral] = useState("");
  const [propertyRegistration, setPropertyRegistration] = useState("");
  const [propertyCity, setPropertyCity] = useState("");
  const [propertyVillage, setPropertyVillage] = useState("");
  const [propertyArea, setPropertyArea] = useState("");



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !authority) {
      toast.error("Por favor completa los campos obligatorios (*)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          internalCode,
          authority,
          carRegional,
          type,
          clientName,
          clientType,
          clientDocumentType,
          clientDocument,
          clientEmail,
          clientAddress,
          clientPhone,
          propertyName,
          propertyCadastral,
          propertyRegistration,
          propertyCity,
          propertyVillage,
          propertyArea,
          propertyAdminName,
          propertyAdminPhone
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al crear expediente");
      }

      const createdItem = await res.json();

      if (rutFile && createdItem.clientId) {
        const formData = new FormData();
        formData.append("file", rutFile);
        formData.append("clientId", createdItem.clientId);
        formData.append("category", "RUT");
        
        const uploadRes = await fetch("/api/documents/upload", {
          method: "POST",
          body: formData
        });

        if (!uploadRes.ok) {
          toast.error("El cliente se creó, pero hubo un error al subir el RUT.");
        }
      }

      toast.success("Cliente y expediente creados correctamente");
      onSuccess();
      onClose();
      // Reset form
      setInternalCode(""); setCarRegional(""); setType("PERMISIVO");
      setClientName(""); setClientType("JURIDICA"); setClientDocumentType("NIT"); setClientDocument(""); setClientEmail(""); setClientAddress(""); setClientPhone("");
      setPropertyAdminName(""); setPropertyAdminPhone(""); setRutFile(null);
      setPropertyName(""); setPropertyCadastral(""); setPropertyRegistration("");
      setPropertyCity(""); setPropertyVillage(""); setPropertyArea("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Hubo un error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                  <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-slate-800 flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-erfor-green" />
                    Nuevo Cliente Ambiental
                  </Dialog.Title>
                  <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-100 transition">
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="max-h-[70vh] overflow-y-auto p-6 space-y-8">
                    
                    {/* SECCIÓN CLIENTE */}
                    <section>
                      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">1. Datos del Cliente</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Cliente *</label>
                          <input required type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Nombre de la empresa o persona" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Persona</label>
                          <select value={clientType} onChange={e => setClientType(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green bg-white">
                            <option value="JURIDICA">Persona Jurídica</option>
                            <option value="NATURAL">Persona Natural</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Identificación</label>
                          <select value={clientDocumentType} onChange={e => setClientDocumentType(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green bg-white">
                            <option value="NIT">NIT</option>
                            <option value="CC">Cédula de Ciudadanía (CC)</option>
                            <option value="CE">Cédula de Extranjería (CE)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Número de Identificación</label>
                          <input type="text" value={clientDocument} onChange={e => setClientDocument(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Ej. 900.123.456-7" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                          <input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="ejemplo@correo.com" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                          <input type="text" value={clientPhone} onChange={e => setClientPhone(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Ej. 300 123 4567" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                          <input type="text" value={clientAddress} onChange={e => setClientAddress(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Ej. Calle 123 # 45-67" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Administrador del Predio</label>
                          <input type="text" value={propertyAdminName} onChange={e => setPropertyAdminName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Nombre del administrador" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono del Administrador</label>
                          <input type="text" value={propertyAdminPhone} onChange={e => setPropertyAdminPhone(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Teléfono del administrador" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 mb-1">Cargar RUT (Opcional)</label>
                          <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={e => setRutFile(e.target.files?.[0] || null)} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-erfor-green/10 file:text-erfor-green hover:file:bg-erfor-green/20" />
                        </div>
                      </div>
                    </section>

                    {/* SECCIÓN EXPEDIENTE */}
                    <section>
                      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">2. Datos del Expediente</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Número de Expediente (CAR)</label>
                          <input type="text" value={internalCode} onChange={e => setInternalCode(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Ej. EXP-2026-001 (Opcional si aún no lo tiene)" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Autoridad Ambiental *</label>
                          <input required type="text" value={authority} onChange={e => setAuthority(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Ej. CAR, ANLA" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Dirección Regional</label>
                          <select value={carRegional} onChange={e => setCarRegional(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green bg-white">
                            <option value="">Seleccione una regional...</option>
                            {CAR_REGIONS.map(r => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Expediente</label>
                          <select value={type} onChange={e => setType(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green bg-white">
                            <option value="PERMISIVO">Permisivo</option>
                            <option value="SANCIONATORIO">Sancionatorio</option>
                          </select>
                        </div>
                      </div>
                    </section>

                    {/* SECCIÓN PREDIO */}
                    <section>
                      <h4 className="text-sm font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">3. Datos de la Finca / Predio</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Finca</label>
                          <input type="text" value={propertyName} onChange={e => setPropertyName(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Nombre del predio" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Cédula Catastral</label>
                          <input type="text" value={propertyCadastral} onChange={e => setPropertyCadastral(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Matrícula Inmobiliaria</label>
                          <input type="text" value={propertyRegistration} onChange={e => setPropertyRegistration(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Municipio</label>
                          <input type="text" value={propertyCity} onChange={e => setPropertyCity(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Municipio" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Vereda</label>
                          <input type="text" value={propertyVillage} onChange={e => setPropertyVillage(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Vereda o Corregimiento" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Área en Hectáreas</label>
                          <input type="text" value={propertyArea} onChange={e => setPropertyArea(e.target.value)} className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-erfor-green focus:outline-none focus:ring-1 focus:ring-erfor-green" placeholder="Ej. 150.5" />
                        </div>
                      </div>
                    </section>

                  </div>

                  <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex justify-end gap-3">
                    <button type="button" onClick={onClose} disabled={loading} className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition">
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="flex items-center justify-center min-w-[120px] rounded-md bg-erfor-green px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-erfor-green/90 transition disabled:opacity-70">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar Registro"}
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
