"use client";

import { useState } from "react";
import { Check, X, Calendar as CalendarIcon, ClipboardCheck } from "lucide-react";

type ObligationStatus = "CUMPLIDO" | "NO_CUMPLIDO" | "PENDIENTE";

interface ObligationItem {
  id: string;
  category: string;
  status: ObligationStatus;
  date?: string;
  isPUEAA?: boolean;
  note?: string;
}

export function ObligationsModule({ fileId }: { fileId: string }) {
  const [obligations, setObligations] = useState<ObligationItem[]>([
    { id: "1", category: "Compensación", status: "PENDIENTE", note: "" },
    { id: "2", category: "Sistema de Medición", status: "CUMPLIDO", note: "" },
    { id: "3", category: "PUEAA", status: "PENDIENTE", isPUEAA: true, date: "", note: "" },
    { id: "4", category: "Consumos", status: "NO_CUMPLIDO", note: "" }
  ]);

  const updateStatus = (id: string, status: ObligationStatus) => {
    setObligations(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const updateDate = (id: string, date: string) => {
    setObligations(prev => prev.map(o => o.id === id ? { ...o, date, status: date ? "CUMPLIDO" : "PENDIENTE" } : o));
  };

  const updateNote = (id: string, note: string) => {
    setObligations(prev => prev.map(o => o.id === id ? { ...o, note } : o));
  };

  return (
    <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
        <ClipboardCheck className="h-5 w-5 text-erfor-green" />
        <h3 className="font-semibold text-slate-800">Módulo de OBLIGACIONES</h3>
      </div>
      
      <div className="grid gap-3 md:grid-cols-2">
        {obligations.map((obs) => (
          <div key={obs.id} className="flex flex-col justify-between rounded-md border border-slate-200 p-4 transition hover:border-erfor-green/50">
            <span className="font-semibold text-slate-800 mb-3">{obs.category}</span>
            
            <div className="flex flex-col gap-3 mt-auto">
              <input 
                type="text" 
                placeholder="Ingresar detalle u observación..." 
                value={obs.note || ""}
                onChange={(e) => updateNote(obs.id, e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none text-slate-700 bg-slate-50"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => updateStatus(obs.id, "CUMPLIDO")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                    obs.status === "CUMPLIDO" 
                      ? "bg-erfor-green text-white border-erfor-green" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <Check className="h-3.5 w-3.5" /> Cumplido
                </button>
                <button
                  onClick={() => updateStatus(obs.id, "NO_CUMPLIDO")}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                    obs.status === "NO_CUMPLIDO" 
                      ? "bg-red-500 text-white border-red-500" 
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <X className="h-3.5 w-3.5" /> No Cumplido
                </button>
              </div>

              {obs.isPUEAA && (
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-sm text-slate-600 whitespace-nowrap">Aprobado en fecha:</span>
                  <div className="relative flex-1">
                    <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input 
                      type="date" 
                      value={obs.date || ""}
                      onChange={(e) => updateDate(obs.id, e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
