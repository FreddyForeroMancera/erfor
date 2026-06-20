"use client";

import { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { useClient } from "@/lib/client-context";
import { Loader2, MapPin, Search, Plus, Map as MapIcon, ChevronRight, FileArchive, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PropertiesModule({ clientId }: { clientId?: string }) {
  const { selectedClientId } = useClient();
  const effectiveClientId = clientId || selectedClientId;
  const router = useRouter();
  const [search, setSearch] = useState("");

  const getImageForProperty = (name: string) => {
    if (name.includes("Esperanza")) return "/predios/hacienda.png";
    if (name.includes("Industrial")) return "/predios/industrial.png";
    if (name.includes("Paraíso")) return "/predios/reserva.png";
    if (name.includes("Porvenir")) return "/predios/porvenir.png";
    return "/predios/hacienda.png"; // Fallback para los demás
  };

  const getSimulatedStats = (name: string) => {
    if (name.includes("Esperanza")) return { files: 3, visits: 1 };
    if (name.includes("Industrial")) return { files: 7, visits: 4 };
    if (name.includes("Paraíso")) return { files: 1, visits: 0 };
    return { files: 0, visits: 0 };
  };

  const query = new URLSearchParams();
  if (effectiveClientId) query.set("clientId", effectiveClientId);
  if (search) query.set("q", search);
  
  const { data, error, isLoading: loading } = useSWR(`/api/properties?${query.toString()}`, fetcher);
  const properties = data?.items || [];
  return (
    <div className="p-4 lg:p-6 xl:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MapIcon className="h-6 w-6 text-erfor-green" />
            Gestión de Predios
          </h1>
          <p className="text-slate-500 text-sm mt-1">Administración territorial y restricciones ambientales</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar predio..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-erfor-green w-[240px]"
            />
          </div>
          <button className="flex items-center gap-2 bg-erfor-green text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors">
            <Plus className="h-4 w-4" />
            Nuevo Predio
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-erfor-green" />
        </div>
      ) : properties.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
          <MapIcon className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-800">No hay predios</h3>
          <p className="text-slate-500 text-sm mt-1">No se encontraron predios para los filtros actuales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map(prop => {
            const bgImage = getImageForProperty(prop.name);
            const stats = getSimulatedStats(prop.name);
            
            return (
            <div 
              key={prop.id} 
              onClick={() => router.push(`/predios/${prop.id}`)}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
            >
              <div className="h-40 bg-slate-100 relative overflow-hidden">
                {bgImage ? (
                  <img src={bgImage} alt={prop.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                  <div className="text-white">
                    <h3 className="font-bold text-lg leading-tight">{prop.name}</h3>
                    <div className="flex items-center text-xs text-white/90 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {prop.city || "Sin municipio"}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Área</p>
                    <p className="text-sm font-medium text-slate-800">{prop.area || "N/D"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Uso</p>
                    <p className="text-sm font-medium text-slate-800">{prop.useCurrent || "N/D"}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Autoridad / Restricción</p>
                    <p className="text-sm font-medium text-slate-800">{prop.environmentalAuthority || "N/D"}</p>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1" title={prop.environmentalRestrictions}>{prop.environmentalRestrictions || "Sin restricciones registradas"}</p>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex gap-4 text-slate-600">
                    <div className="flex items-center gap-1.5" title="Expedientes">
                      <FileArchive className="h-4 w-4 text-sky-600" />
                      <span className="text-xs font-bold">{stats.files} Expedientes</span>
                    </div>
                    <div className="flex items-center gap-1.5" title="Visitas">
                      <Building2 className="h-4 w-4 text-erfor-green" />
                      <span className="text-xs font-bold">{stats.visits} Visitas</span>
                    </div>
                  </div>
                  <div className="text-erfor-green text-sm font-medium flex items-center group-hover:underline">
                    Ver <ChevronRight className="h-4 w-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}
    </div>
  );
}
