"use client";

import { useState, Fragment, useEffect } from "react";
import { Check, X, Calendar as CalendarIcon, FileBarChart, Plus, AlertTriangle } from "lucide-react";
import { usePersistedToggle } from "@/hooks/use-persisted-toggle";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";

type ReportStatus = "CUMPLIDO" | "NO_CUMPLIDO" | "PENDIENTE";
type Periodicity = "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

interface ReportItem {
  id: string;
  expectedDate: string;
  status: ReportStatus;
  radicado: string;
  actualDate: string;
  documentName?: string;
}

export function ConsumptionReportsModule({ fileId }: { fileId: string }) {
  const [isActive, handleToggleActive, setIsActive] = usePersistedToggle(`consumption-active-${fileId}`, false);
  const [periodicity, setPeriodicity] = useState<Periodicity>("ANUAL");
  const [reports, setReports] = useState<ReportItem[]>([
    {
      id: "1",
      expectedDate: "",
      status: "PENDIENTE",
      radicado: "",
      actualDate: ""
    }
  ]);
  
  // Security Modal State
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'PERIODICITY' | 'STATUS';
    payload: any;
  } | null>(null);

  const handleActivate = () => setIsActive(true);

  // Load/Save (Simulated with LocalStorage for now)
  useEffect(() => {
    if (!isActive) return;
    const saved = localStorage.getItem(`consumos-${fileId}`);
    if (saved) {
      const data = JSON.parse(saved);
      if (data.periodicity) setPeriodicity(data.periodicity);
      if (data.reports && data.reports.length > 0) setReports(data.reports);
    }
  }, [isActive, fileId]);

  const saveToLocal = (p: Periodicity, r: ReportItem[]) => {
    localStorage.setItem(`consumos-${fileId}`, JSON.stringify({ periodicity: p, reports: r }));
  };

  const handlePeriodicityRequest = (newP: Periodicity) => {
    if (newP === periodicity) return;
    setPendingAction({ type: 'PERIODICITY', payload: newP });
    setConfirmationChecked(false);
    setIsConfirmModalOpen(true);
  };

  const handleStatusRequest = (id: string, newStatus: ReportStatus) => {
    const report = reports.find(r => r.id === id);
    if (report?.status === newStatus) {
       // If it's the same, maybe they want to uncheck it? Let's just switch back to PENDIENTE
       const newReports = reports.map(r => r.id === id ? { ...r, status: "PENDIENTE" as ReportStatus } : r);
       setReports(newReports);
       saveToLocal(periodicity, newReports);
       return;
    }
    
    setPendingAction({ type: 'STATUS', payload: { id, status: newStatus } });
    setConfirmationChecked(false);
    setIsConfirmModalOpen(true);
  };

  const confirmAction = () => {
    if (!pendingAction) return;
    
    if (pendingAction.type === 'PERIODICITY') {
      setPeriodicity(pendingAction.payload);
      saveToLocal(pendingAction.payload, reports);
      toast.success("Frecuencia actualizada con seguridad");
    } 
    else if (pendingAction.type === 'STATUS') {
      const { id, status } = pendingAction.payload;
      const newReports = reports.map(r => r.id === id ? { ...r, status } : r);
      setReports(newReports);
      saveToLocal(periodicity, newReports);
      toast.success("Estado actualizado con seguridad");
    }
    
    setIsConfirmModalOpen(false);
    setPendingAction(null);
  };

  const addReport = () => {
    const newReports = [...reports, {
      id: Date.now().toString(),
      expectedDate: "",
      status: "PENDIENTE" as ReportStatus,
      radicado: "",
      actualDate: ""
    }];
    setReports(newReports);
    saveToLocal(periodicity, newReports);
  };

  const updateReportField = (id: string, field: keyof ReportItem, value: string) => {
    const newReports = reports.map(r => r.id === id ? { ...r, [field]: value } : r);
    setReports(newReports);
    saveToLocal(periodicity, newReports);
  };

  return (
    <section className={`mt-4 rounded-lg border ${isActive ? "border-erfor-green/30 bg-white" : "border-slate-200 bg-slate-50/50"} p-5 shadow-sm transition-colors`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <FileBarChart className={`h-5 w-5 ${isActive ? "text-erfor-green" : "text-slate-400"}`} />
          <h3 className={`font-semibold ${isActive ? "text-slate-800" : "text-slate-500 uppercase tracking-wide text-sm"}`}>Módulo de Reporte Consumos</h3>
        </div>
        
        <button
          onClick={handleToggleActive}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-erfor-green focus:ring-offset-2 ${
            isActive ? 'bg-erfor-green' : 'bg-slate-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      
      {!isActive ? (
        <div className="py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
          <FileBarChart className="h-8 w-8 text-slate-300 mb-2" />
          <p>El módulo de reporte de consumos se encuentra desactivado.</p>
          <button onClick={handleActivate} className="mt-2 text-erfor-green hover:underline font-medium">Activar módulo</button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Frecuencia (Con Seguridad) */}
          <div className="flex items-center gap-6 bg-slate-50 p-4 rounded-md border border-slate-200">
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={periodicity === "MENSUAL"} 
                  onChange={() => handlePeriodicityRequest("MENSUAL")}
                  className="text-erfor-green rounded border-slate-300 focus:ring-erfor-green h-4 w-4"
                />
                <span className="text-sm font-medium text-slate-700">Mensual</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={periodicity === "TRIMESTRAL"} 
                  onChange={() => handlePeriodicityRequest("TRIMESTRAL")}
                  className="text-erfor-green rounded border-slate-300 focus:ring-erfor-green h-4 w-4"
                />
                <span className="text-sm font-medium text-slate-700">Trimestral</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={periodicity === "SEMESTRAL"} 
                  onChange={() => handlePeriodicityRequest("SEMESTRAL")}
                  className="text-erfor-green rounded border-slate-300 focus:ring-erfor-green h-4 w-4"
                />
                <span className="text-sm font-medium text-slate-700">Semestral</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={periodicity === "ANUAL"} 
                  onChange={() => handlePeriodicityRequest("ANUAL")}
                  className="text-erfor-green rounded border-slate-300 focus:ring-erfor-green h-4 w-4"
                />
                <span className="text-sm font-medium text-slate-700">Anual</span>
              </label>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 ml-auto" title="Requiere confirmación de seguridad">
              <AlertTriangle className="h-3.5 w-3.5" />
              Con Seguridad
            </div>
          </div>

          {/* Lista de Presentaciones */}
          <div>
            <h4 className="text-sm font-bold text-slate-700 mb-3 tracking-wider">Presentaciones:</h4>
            
            <div className="space-y-3">
              {reports.map((rep, index) => (
                <div key={rep.id} className="flex flex-wrap items-end gap-4 p-4 rounded-md border border-slate-200 bg-white shadow-sm hover:border-erfor-green/50 transition">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-500 font-bold text-xs shrink-0 self-center">
                    {index + 1}
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fechas</label>
                    <input 
                      type="date"
                      value={rep.expectedDate}
                      onChange={(e) => updateReportField(rep.id, 'expectedDate', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-md border border-slate-200 self-center h-[38px] mt-[18px]">
                    <label className="flex items-center gap-1.5 cursor-pointer px-2">
                      <input 
                        type="checkbox"
                        checked={rep.status === "CUMPLIDO"}
                        onChange={() => handleStatusRequest(rep.id, "CUMPLIDO")}
                        className="text-erfor-green rounded border-slate-300 focus:ring-erfor-green h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">Cumplido</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer px-2 border-l border-slate-200 pl-4">
                      <input 
                        type="checkbox"
                        checked={rep.status === "NO_CUMPLIDO"}
                        onChange={() => handleStatusRequest(rep.id, "NO_CUMPLIDO")}
                        className="text-red-500 rounded border-slate-300 focus:ring-red-500 h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-slate-700">No cumplido</span>
                    </label>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 shrink-0 self-center mt-[18px]" title="Requiere confirmación de seguridad">
                    <AlertTriangle className="h-3 w-3" />
                    Con Seguridad
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Número Radicado</label>
                    <input 
                      type="text"
                      value={rep.radicado}
                      onChange={(e) => updateReportField(rep.id, 'radicado', e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fecha real</label>
                    <input 
                      type="date"
                      value={rep.actualDate}
                      onChange={(e) => updateReportField(rep.id, 'actualDate', e.target.value)}
                      className="px-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none"
                    />
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Documento Radicado</label>
                    <input 
                      type="file"
                      onChange={(e) => updateReportField(rep.id, 'documentName', e.target.files?.[0]?.name || '')}
                      className="w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-erfor-mist file:text-erfor-green hover:file:bg-erfor-green/20 cursor-pointer focus:outline-none"
                    />
                  </div>
                </div>
              ))}

              <div className="flex justify-end mt-4 pt-2">
                <button 
                  onClick={addReport}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-md font-semibold text-sm transition border border-slate-200"
                >
                  <Plus className="h-4 w-4" /> Crear mas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Seguridad (Doble Aprobación) */}
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
                    Estás a punto de modificar un campo protegido del reporte de consumos ({pendingAction?.type === 'PERIODICITY' ? 'Frecuencia' : 'Estado de Cumplimiento'}).
                  </p>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-erfor-green focus:ring-erfor-green" checked={confirmationChecked} onChange={(e) => setConfirmationChecked(e.target.checked)} />
                      <span className="text-sm font-medium text-slate-700">Entiendo las implicaciones y confirmo que deseo realizar este cambio.</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</button>
                    <button type="button" disabled={!confirmationChecked} className="rounded-lg bg-erfor-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed" onClick={confirmAction}>Confirmar Cambio</button>
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
