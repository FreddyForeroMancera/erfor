"use client";

import { useState } from "react";
import { Search, Plus, Filter, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

type LegalRequirement = {
  id: string;
  title: string;
  normType: string;
  normNumber: string | null;
  year: number | null;
  authority: string | null;
  category: string;
  status: string;
  verified: boolean;
};

export function LegalRequirementsModule({ initialData }: { initialData: LegalRequirement[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState(initialData);

  const filteredData = data.filter(req => 
    req.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    req.normType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (req.normNumber && req.normNumber.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <main className="p-4 lg:p-6 xl:p-8 min-h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Matriz de Requisitos Legales</h1>
          <p className="text-sm text-slate-500 mt-1">Repositorio normativo y base de obligaciones aplicables.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-md bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Filter className="h-4 w-4" />
            Filtros
          </button>
          <button 
            onClick={() => toast.error("Formulario de creación en desarrollo")}
            className="flex items-center gap-2 rounded-md bg-erfor-green px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-erfor-green/90"
          >
            <Plus className="h-4 w-4" />
            Nueva Norma
          </button>
        </div>
      </div>

      <div className="mb-6 flex max-w-md items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-erfor-green focus-within:ring-1 focus-within:ring-erfor-green">
        <Search className="h-5 w-5 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar por norma, número o título..." 
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="flex-1 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
              <tr>
                <th className="px-6 py-4">Norma</th>
                <th className="px-6 py-4">Título / Asunto</th>
                <th className="px-6 py-4">Autoridad</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <p className="text-base font-medium">No se encontraron requisitos legales</p>
                    <p className="text-sm mt-1">Ajusta tu búsqueda o agrega una nueva norma.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-800">{req.normType} {req.normNumber}</div>
                      <div className="text-xs text-slate-500">Año: {req.year || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 max-w-md">
                      <div className="font-medium text-slate-800 line-clamp-2">{req.title}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{req.authority || "-"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                        {req.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {req.verified ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-erfor-green">
                          <CheckCircle2 className="h-4 w-4" />
                          Verificado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600">
                          <AlertCircle className="h-4 w-4" />
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-erfor-green font-medium text-sm hover:underline">
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
