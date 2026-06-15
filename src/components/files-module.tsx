"use client";

import { useState, useEffect } from "react";
import { useClient } from "@/lib/client-context";
import { Loader2, FolderKanban, Search, Plus, AlertTriangle, Calendar, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export function FilesModule() {
  const { selectedClientId } = useClient();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedClientId) query.set("clientId", selectedClientId);
        if (search) query.set("q", search);
        
        const res = await fetch(`/api/environmentalFiles?${query.toString()}`);
        if (!res.ok) throw new Error("Error al cargar expedientes");
        const data = await res.json();
        setFiles(data.items || []);
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    const timer = setTimeout(load, 300);
    return () => clearTimeout(timer);
  }, [selectedClientId, search]);

  const getRiskColor = (risk: string) => {
    if (risk === "CRITICAL") return "border-red-500 bg-red-50 text-red-700";
    if (risk === "HIGH") return "border-orange-500 bg-orange-50 text-orange-700";
    if (risk === "LOW") return "border-green-500 bg-green-50 text-green-700";
    return "border-amber-400 bg-amber-50 text-amber-700"; // MEDIUM
  };

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-sky-600" />
            Expedientes Ambientales
          </h1>
          <p className="text-slate-500 text-sm mt-1">Control de estado, líneas de tiempo y niveles de riesgo</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar expediente..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-sky-600 w-[240px]"
            />
          </div>
          <button className="flex items-center gap-2 bg-sky-600 text-white px-4 py-2 rounded-md font-medium hover:bg-sky-700 transition-colors">
            <Plus className="h-4 w-4" />
            Nuevo Expediente
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
          <FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-800">No hay expedientes</h3>
          <p className="text-slate-500 text-sm mt-1">No se encontraron expedientes para los filtros actuales.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {files.map(file => (
            <div key={file.id} className="bg-white rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col md:flex-row md:items-center gap-6">
              
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      {file.internalCode}
                      {file.riskLevel === "CRITICAL" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700">
                          <AlertTriangle className="h-3 w-3" /> Riesgo Crítico
                        </span>
                      )}
                    </h3>
                    <p className="text-sm font-medium text-slate-600 mt-1">{file.type}</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(file.riskLevel)}`}>
                    Estado: {file.status.replace("_", " ")}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Entidad</p>
                    <p className="text-sm font-medium text-slate-800">{file.authority}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Exp. Oficial</p>
                    <p className="text-sm font-medium text-slate-800">{file.officialCode || "En trámite"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase font-semibold mb-1">Progreso General</p>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${file.status === 'COMPLETED' || file.status === 'APPROVED' ? 'bg-green-500 w-full' : 'bg-sky-500 w-1/3'}`}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full md:w-auto flex md:flex-col items-center justify-between gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                <div className="text-left md:text-center">
                  <p className="text-xs text-slate-500 uppercase font-semibold mb-1 flex items-center gap-1 justify-start md:justify-center">
                    <Calendar className="h-3 w-3" /> Vencimiento
                  </p>
                  <p className={`text-sm font-bold ${file.riskLevel === 'CRITICAL' ? 'text-red-600' : 'text-slate-800'}`}>
                    {file.nextDeadline ? new Date(file.nextDeadline).toLocaleDateString() : "Sin fecha"}
                  </p>
                </div>
                <button className="text-sky-600 text-sm font-medium flex items-center bg-sky-50 px-4 py-2 rounded-md hover:bg-sky-100 transition-colors">
                  Abrir <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
