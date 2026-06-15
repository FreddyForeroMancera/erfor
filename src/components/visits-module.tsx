"use client";

import { useState, useEffect } from "react";
import { useClient } from "@/lib/client-context";
import { Loader2, Building2, Search, Plus, CalendarDays, MapPin, UploadCloud, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

export function VisitsModule() {
  const { selectedClientId } = useClient();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedClientId) query.set("clientId", selectedClientId);
        if (search) query.set("q", search);
        
        const res = await fetch(`/api/visits?${query.toString()}`);
        if (!res.ok) throw new Error("Error al cargar visitas");
        const data = await res.json();
        setVisits(data.items || []);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [selectedClientId, search]);

  const sortedVisits = [...visits].sort((a, b) => {
    const dateA = new Date(a.scheduledAt || 0).getTime();
    const dateB = new Date(b.scheduledAt || 0).getTime();
    return dateA - dateB; // Ascendente (lo más pronto primero)
  });

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-erfor-green" />
            Visitas e Inspecciones
          </h1>
          <p className="text-slate-500 text-sm mt-1">Agenda de campo, actas y registro de evidencias</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar visita..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-erfor-green w-[240px]"
            />
          </div>
          <button className="flex items-center gap-2 bg-erfor-green text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors">
            <Plus className="h-4 w-4" />
            Programar Visita
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-erfor-green" />
        </div>
      ) : sortedVisits.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-800">No hay visitas</h3>
          <p className="text-slate-500 text-sm mt-1">No se encontraron visitas para los filtros actuales.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-200 ml-3 md:ml-6 pl-6 md:pl-8 space-y-8 py-4">
          {sortedVisits.map(visit => {
            const isCompleted = visit.status === "COMPLETED";
            return (
              <div key={visit.id} className="relative bg-white rounded-xl border border-slate-200 shadow-sm p-5 transition-all hover:shadow-md">
                {/* Timeline Dot */}
                <div className={`absolute -left-[35px] md:-left-[43px] top-6 h-4 w-4 rounded-full border-4 border-white shadow-sm ${isCompleted ? 'bg-erfor-green' : 'bg-amber-500'}`}></div>
                
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                        <CalendarDays className="h-4 w-4" />
                        {visit.scheduledAt ? new Date(visit.scheduledAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : "Sin fecha"}
                      </div>
                      {isCompleted && (
                        <span className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                          <CheckCircle2 className="h-3 w-3" /> Realizada
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-800 mb-1">{visit.type}</h3>
                    <p className="text-sm text-slate-600 flex items-center gap-1 mb-4">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {visit.property?.name || "Sin predio asignado"}
                    </p>

                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Objetivo de la visita</p>
                      <p className="text-sm text-slate-700">{visit.objective || "Sin objetivo descrito"}</p>
                    </div>
                  </div>

                  <div className="w-full md:w-64 shrink-0 flex flex-col gap-2">
                    <button className="w-full flex items-center justify-center gap-2 bg-white border-2 border-erfor-green text-erfor-green hover:bg-green-50 px-4 py-2.5 rounded-lg font-medium transition-colors">
                      <UploadCloud className="h-4 w-4" />
                      Subir Acta / Evidencia
                    </button>
                    <button className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 hover:bg-slate-200 px-4 py-2.5 rounded-lg font-medium transition-colors">
                      Modificar Detalles
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
