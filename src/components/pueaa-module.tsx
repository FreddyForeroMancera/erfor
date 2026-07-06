"use client";

import { useState, Fragment, useEffect } from "react";
import { Check, X, Droplets, AlertTriangle } from "lucide-react";
import { usePersistedToggle } from "@/hooks/use-persisted-toggle";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";

interface PueaaYear {
  year: number;
  startDate: string;
  endDate: string;
  presented: boolean;
  radicado: string;
  presentationDate: string;
}

export function PueaaModule({ fileId }: { fileId: string }) {
  const [isActive, handleToggleActive, setIsActive] = usePersistedToggle(`pueaa-active-${fileId}`, false);
  
  const [yearsData, setYearsData] = useState<PueaaYear[]>(
    Array.from({ length: 5 }, (_, i) => ({
      year: i + 1,
      startDate: "",
      endDate: "",
      presented: false,
      radicado: "",
      presentationDate: ""
    }))
  );

  // Security Modal State for "presented" checkbox
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    yearIndex: number;
    presented: boolean;
  } | null>(null);

  const handleActivate = () => setIsActive(true);

  // Load/Save (Simulated with LocalStorage for now)
  useEffect(() => {
    if (!isActive) return;
    const saved = localStorage.getItem(`pueaa-${fileId}`);
    if (saved) {
      const data = JSON.parse(saved);
      if (data && data.length === 5) {
        setYearsData(data);
      }
    }
  }, [isActive, fileId]);

  const saveToLocal = (data: PueaaYear[]) => {
    localStorage.setItem(`pueaa-${fileId}`, JSON.stringify(data));
  };

  const handlePresentedRequest = (index: number, newStatus: boolean) => {
    if (yearsData[index].presented === newStatus) return;
    
    // If they are unchecking, just allow it without double confirm?
    // Let's require it for both just to be consistent, or maybe just checking.
    // Let's require it for any change to "presented".
    setPendingAction({ yearIndex: index, presented: newStatus });
    setConfirmationChecked(false);
    setIsConfirmModalOpen(true);
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    
    const { yearIndex, presented } = pendingAction;
    const newData = [...yearsData];
    newData[yearIndex].presented = presented;
    
    setYearsData(newData);
    saveToLocal(newData);
    toast.success("Estado de presentación actualizado con seguridad");
    
    setIsConfirmModalOpen(false);
    setPendingAction(null);
  };

  const updateField = (index: number, field: keyof PueaaYear, value: string) => {
    const newData = [...yearsData];
    (newData[index] as any)[field] = value;
    setYearsData(newData);
    saveToLocal(newData);
  };

  return (
    <section className={`mt-4 rounded-lg border ${isActive ? "border-blue-500/30 bg-white" : "border-slate-200 bg-slate-50/50"} p-5 shadow-sm transition-colors`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Droplets className={`h-5 w-5 ${isActive ? "text-blue-500" : "text-slate-400"}`} />
          <h3 className={`font-semibold ${isActive ? "text-slate-800" : "text-slate-500 uppercase tracking-wide text-sm"}`}>Avances PUEAA</h3>
        </div>
        
        <button
          onClick={handleToggleActive}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            isActive ? 'bg-blue-500' : 'bg-slate-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      
      {!isActive ? (
        <div className="py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
          <Droplets className="h-8 w-8 text-slate-300 mb-2" />
          <p>El módulo de avances PUEAA se encuentra desactivado.</p>
          <button onClick={handleActivate} className="mt-2 text-blue-500 hover:underline font-medium">Activar módulo</button>
        </div>
      ) : (
        <div className="space-y-6">
          
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-md border border-slate-200 inline-flex">
            <span className="text-sm font-bold text-slate-700">Frecuencia predefinida:</span>
            <span className="text-sm font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">Anual</span>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 tracking-wider">Años de Seguimiento:</h4>
            
            <div className="space-y-3">
              {yearsData.map((data, index) => (
                <div key={index} className="flex flex-col lg:flex-row lg:items-end gap-4 p-4 rounded-md border border-slate-200 bg-white shadow-sm hover:border-blue-500/50 transition">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-600 font-bold text-xs shrink-0 self-start lg:self-center">
                    Año {data.year}
                  </div>
                  
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fecha inicial</label>
                      <input 
                        type="date"
                        value={data.startDate}
                        onChange={(e) => updateField(index, 'startDate', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fecha final</label>
                      <input 
                        type="date"
                        value={data.endDate}
                        onChange={(e) => updateField(index, 'endDate', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-blue-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-50 p-1.5 px-3 rounded-md border border-slate-200 h-[38px]">
                      <label className="flex items-center gap-2 cursor-pointer w-full">
                        <input 
                          type="checkbox"
                          checked={data.presented}
                          onChange={(e) => handlePresentedRequest(index, e.target.checked)}
                          className="text-blue-500 rounded border-slate-300 focus:ring-blue-500 h-4 w-4"
                        />
                        <span className="text-xs font-bold text-slate-700">Presentado</span>
                      </label>
                      
                      <div className="text-[10px] text-amber-600 bg-amber-50 p-1 rounded border border-amber-200 shrink-0" title="Requiere seguridad">
                        <AlertTriangle className="h-3 w-3" />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Número Radicado</label>
                      <input 
                        type="text"
                        value={data.radicado}
                        onChange={(e) => updateField(index, 'radicado', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-blue-500 focus:outline-none"
                        placeholder="Ej. RAD-2026-..."
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fecha</label>
                      <input 
                        type="date"
                        value={data.presentationDate}
                        onChange={(e) => updateField(index, 'presentationDate', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seguridad */}
      <Transition appear show={isConfirmModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsConfirmModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4 text-amber-600">
                    <AlertTriangle className="h-6 w-6" />
                    <Dialog.Title as="h3" className="text-lg font-bold">Doble Aprobación Requerida</Dialog.Title>
                  </div>
                  <p className="text-sm text-slate-600 mb-6">
                    Estás a punto de modificar el estado de presentación (Presentado) del Año {pendingAction ? pendingAction.yearIndex + 1 : ''}.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-500 focus:ring-blue-500" checked={confirmationChecked} onChange={(e) => setConfirmationChecked(e.target.checked)} />
                      <span className="text-sm font-medium text-slate-700">Entiendo las implicaciones y confirmo que deseo realizar este cambio.</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</button>
                    <button type="button" disabled={!confirmationChecked} className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed" onClick={confirmAction}>Confirmar Cambio</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </section>
  );
}
