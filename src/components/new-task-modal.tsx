"use client";

import { useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, CalendarPlus, Loader2, Calendar, FileText, User } from "lucide-react";
import toast from "react-hot-toast";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function NewTaskModal({ isOpen, onClose, onSuccess }: NewTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("Trámite CAR");
  const [priority, setPriority] = useState("Media");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [description, setDescription] = useState("");
  const [requiresDocument, setRequiresDocument] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simular llamada a API para guardar la tarea
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success("Tarea ambiental creada y asignada exitosamente");
      if (onSuccess) onSuccess();
      onClose();
      
      // Limpiar formulario
      setTitle("");
      setType("Trámite CAR");
      setPriority("Media");
      setDueDate("");
      setAssignee("");
      setDescription("");
      setRequiresDocument(false);
    } catch (error: any) {
      toast.error("Hubo un error al crear la tarea");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                  <Dialog.Title as="h3" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <CalendarPlus className="h-5 w-5 text-erfor-green" />
                    Programar Nueva Tarea
                  </Dialog.Title>
                  <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Título de la Tarea</label>
                    <input 
                      required 
                      type="text" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm" 
                      placeholder="Ej. Radicar respuesta a requerimiento CAR, Visita técnica..." 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Actividad</label>
                      <select value={type} onChange={e => setType(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm">
                        <option value="Trámite CAR">Trámite ante CAR / ANLA</option>
                        <option value="Monitoreo">Monitoreo Ambiental</option>
                        <option value="Visita Técnica">Visita Técnica / Inspección</option>
                        <option value="Informe">Elaboración de Informe (ICA/PMA)</option>
                        <option value="Financiero">Pago de Tasa / Obligación Financiera</option>
                        <option value="Reunión Cliente">Reunión con Cliente</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Nivel de Prioridad</label>
                      <select value={priority} onChange={e => setPriority(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm">
                        <option value="Alta">🔴 Alta (Crítica / Vencimiento cercano)</option>
                        <option value="Media">🟡 Media (Seguimiento regular)</option>
                        <option value="Baja">🟢 Baja (Largo plazo)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-slate-400" /> Fecha Límite (Plazo)
                      </label>
                      <input required type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        <User className="h-4 w-4 text-slate-400" /> Asignar Responsable
                      </label>
                      <select required value={assignee} onChange={e => setAssignee(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm">
                        <option value="" disabled>Seleccionar consultor...</option>
                        <option value="Ingeniero Residente">Ingeniero Residente</option>
                        <option value="Auditor Ambiental">Auditor Ambiental</option>
                        <option value="Abogado">Abogado / Jurídico</option>
                        <option value="Cliente">Responsabilidad del Cliente</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      <FileText className="h-4 w-4 text-slate-400" /> Descripción / Observaciones
                    </label>
                    <textarea 
                      value={description} 
                      onChange={e => setDescription(e.target.value)} 
                      rows={3} 
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-erfor-green focus:border-erfor-green text-sm" 
                      placeholder="Detalles sobre lo que se debe ejecutar en esta tarea..." 
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="requiresDoc" 
                      checked={requiresDocument} 
                      onChange={e => setRequiresDocument(e.target.checked)} 
                      className="rounded border-slate-300 text-erfor-green focus:ring-erfor-green h-4 w-4" 
                    />
                    <label htmlFor="requiresDoc" className="text-sm font-medium text-slate-700 cursor-pointer">
                      Exigir cargar un documento comprobante al finalizar (Ej. Auto, Radicado, Recibo de caja)
                    </label>
                  </div>

                  <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition" disabled={loading}>
                      Cancelar
                    </button>
                    <button type="submit" disabled={loading} className="flex items-center gap-2 bg-erfor-green text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-70">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarPlus className="h-4 w-4" />}
                      Guardar Tarea
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
