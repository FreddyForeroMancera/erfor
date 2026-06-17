"use client";

import { useState } from "react";
import { Plus, Search, FileCheck2, Filter, MoreVertical, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";

type Procedure = {
  id: string;
  type: string;
  authority: string;
  status: string;
  filingNumber: string | null;
  filingDate: Date | null;
  expectedResponseDate: Date | null;
  project: { name: string } | null;
  client: { name: string } | null;
};

const COLUMNS = [
  { id: "PREPARATION", title: "En Preparación" },
  { id: "FILED", title: "Radicado (CAR)" },
  { id: "EVALUATION", title: "En Evaluación" },
  { id: "APPROVED", title: "Aprobado / Permiso Otorgado" },
];

export function ProceduresModule({ initialData }: { initialData: Procedure[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [procedures, setProcedures] = useState(initialData);

  const filteredProcedures = procedures.filter(p => 
    p.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.filingNumber && p.filingNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.client?.name && p.client.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50 p-4 lg:p-6 xl:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Trámites y Permisos</h1>
          <p className="mt-1 text-sm text-slate-500">Haz seguimiento al estado de radicación ante las Autoridades Ambientales.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-erfor-green">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              className="bg-transparent text-sm outline-none placeholder:text-slate-400 w-full sm:w-48"
              placeholder="Buscar trámite..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => toast.error("Creación de Trámite en desarrollo")}
            className="flex items-center gap-2 rounded-md bg-erfor-green px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-erfor-green/90"
          >
            <Plus className="h-4 w-4" />
            Radicar Trámite
          </button>
        </div>
      </div>

      <div className="erfor-scroll flex flex-1 gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colItems = filteredProcedures.filter(p => {
            // Mapeos básicos de estado para que encajen en las 4 columnas
            if (col.id === "PREPARATION") return ["DRAFT", "PREPARATION", "IN_REVIEW"].includes(p.status);
            if (col.id === "FILED") return ["FILED", "REQUIREMENT"].includes(p.status);
            if (col.id === "EVALUATION") return ["EVALUATION", "VISIT", "TECHNICAL_CONCEPT"].includes(p.status);
            if (col.id === "APPROVED") return ["APPROVED", "COMPLETED"].includes(p.status);
            return false;
          });

          return (
            <div key={col.id} className="flex h-full w-80 shrink-0 flex-col rounded-lg bg-slate-100/80 p-3">
              <div className="mb-3 flex items-center justify-between px-1">
                <h3 className="font-semibold text-slate-700">{col.title}</h3>
                <span className="flex h-5 items-center justify-center rounded-full bg-slate-200 px-2 text-xs font-medium text-slate-600">
                  {colItems.length}
                </span>
              </div>
              <div className="erfor-scroll flex-1 space-y-3 overflow-y-auto">
                {colItems.map((item) => (
                  <article key={item.id} className="group cursor-grab rounded-md border border-slate-200 bg-white p-4 shadow-sm hover:border-erfor-green/50 active:cursor-grabbing">
                    <div className="flex items-start justify-between">
                      <span className="inline-block rounded bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700">
                        {item.type}
                      </span>
                      <button className="text-slate-400 hover:text-slate-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-2 text-sm font-medium text-slate-800 line-clamp-2">
                      {item.project?.name || item.client?.name || "Sin Asignar"}
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <FileCheck2 className="h-3.5 w-3.5" />
                      <span>{item.filingNumber ? `Rad: ${item.filingNumber}` : "Sin Radicado"}</span>
                    </div>
                    {item.expectedResponseDate && (
                      <div className="mt-2 border-t border-slate-100 pt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          Resolución:
                        </span>
                        <span className="font-medium text-erfor-green">
                          {new Date(item.expectedResponseDate).toLocaleDateString("es-CO")}
                        </span>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
