"use client";

import { useState } from "react";
import { FolderKanban, BarChart, FileCheck, FileCode, Calendar, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { Dialog } from "@headlessui/react";

export type TrackerStatus = "DRAFT" | "PREPARATION" | "EVALUATION" | "APPROVED" | "COMPLETED";

interface Props {
  fileId: string;
  currentStatus: string;
  onStatusUpdated: () => void;
}

export function ExpedienteStatusTracker({ fileId, currentStatus, onStatusUpdated }: Props) {
  const [selectedStatus, setSelectedStatus] = useState<TrackerStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  const steps = [
    { id: "DRAFT", label: "Cotizaciones", sub: "Presupuestos y Propuestas", icon: FolderKanban, color: "text-erfor-green", bgActive: "bg-erfor-green/10", borderActive: "border-erfor-green", ringHover: "hover:ring-erfor-green" },
    { id: "PREPARATION", label: "En Proceso", sub: "Preparación y Revisión", icon: BarChart, color: "text-purple-600", bgActive: "bg-purple-100", borderActive: "border-purple-600", ringHover: "hover:ring-purple-600" },
    { id: "EVALUATION", label: "En Trámite", sub: "Ante autoridades", icon: FileCheck, color: "text-sky-600", bgActive: "bg-sky-100", borderActive: "border-sky-600", ringHover: "hover:ring-sky-600" },
    { id: "APPROVED", label: "Otorgado", sub: "Permisos y Licencias", icon: FileCode, color: "text-amber-500", bgActive: "bg-amber-100", borderActive: "border-amber-500", ringHover: "hover:ring-amber-500" },
    { id: "COMPLETED", label: "En Seguimiento", sub: "Vigilancia de Obligaciones", icon: Calendar, color: "text-red-600", bgActive: "bg-red-100", borderActive: "border-red-600", ringHover: "hover:ring-red-600" },
  ];

  // Encuentra el índice del estado actual, o 0 por defecto
  const currentIndex = Math.max(0, steps.findIndex(s => s.id === currentStatus));

  const handleStepClick = (stepId: TrackerStatus) => {
    if (stepId === currentStatus) return; // No hacer nada si ya está en ese estado
    setSelectedStatus(stepId);
    setConfirmationChecked(false);
    setIsModalOpen(true);
  };

  const handleConfirmChange = async () => {
    if (!selectedStatus) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/expedientes/${fileId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus })
      });

      if (!res.ok) throw new Error("Error al actualizar");
      
      onStatusUpdated();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Ocurrió un error al intentar cambiar el estado.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">ESTADO DEL EXPEDIENTE</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {steps.map((step, index) => {
          const isActive = step.id === currentStatus;
          const isPassed = index < currentIndex;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              onClick={() => handleStepClick(step.id as TrackerStatus)}
              className={`
                relative p-4 rounded-xl border transition-all duration-200 cursor-pointer
                ${isActive ? `${step.borderActive} ${step.bgActive} shadow-sm ring-1 ring-inset ring-current` : "border-slate-200 bg-white hover:-translate-y-1 hover:shadow-md ring-1 ring-transparent"}
                ${!isActive && step.ringHover}
              `}
            >
              {isPassed && !isActive && (
                <div className="absolute top-3 right-3">
                  <CheckCircle2 className="w-5 h-5 text-slate-300" />
                </div>
              )}
              {isActive && (
                <div className="absolute top-3 right-3">
                  <Icon className={`w-6 h-6 ${step.color}`} />
                </div>
              )}
              {!isActive && !isPassed && (
                <div className="absolute top-3 right-3">
                  <Icon className={`w-5 h-5 ${step.color} opacity-40`} />
                </div>
              )}

              <div className="mt-6">
                <p className={`font-semibold ${isActive ? step.color : "text-slate-700"}`}>
                  {step.label}
                </p>
                <p className="text-xs text-slate-500 mt-1">{step.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Doble Aprobación */}
      <Dialog open={isModalOpen} onClose={() => !isUpdating && setIsModalOpen(false)} className="relative z-50">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <Dialog.Title className="text-lg font-bold text-slate-800">
                Cambiar Estado del Expediente
              </Dialog.Title>
            </div>
            
            <Dialog.Description className="text-sm text-slate-600 mb-6">
              Estás a punto de avanzar el expediente a la fase de <strong>{steps.find(s => s.id === selectedStatus)?.label}</strong>. Este cambio quedará registrado en el historial y podría disparar alertas o tareas automáticas.
            </Dialog.Description>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-erfor-green focus:ring-erfor-green"
                  checked={confirmationChecked}
                  onChange={(e) => setConfirmationChecked(e.target.checked)}
                />
                <span className="text-sm font-medium text-slate-700">
                  Entiendo las implicaciones y confirmo que deseo realizar este cambio de estado.
                </span>
              </label>
            </div>

            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={isUpdating}
                className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button 
                onClick={handleConfirmChange}
                disabled={!confirmationChecked || isUpdating}
                className="flex items-center gap-2 px-4 py-2 bg-erfor-green text-white rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirmar Cambio
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
