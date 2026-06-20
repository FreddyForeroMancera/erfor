"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { useClient } from "@/lib/client-context";
import { Loader2, Search, Plus, FolderKanban, ChevronRight, Building2, FileArchive, X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { NewExpedienteModal } from "./new-expediente-modal";

export function FilesModule({ clientId }: { clientId?: string }) {
  const { selectedClientId } = useClient();
  const effectiveClientId = clientId || selectedClientId;
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const CAR_REGIONS = [
    "Regional Sabana Centro",
    "Regional Bogotá - La Calera",
    "Regional Soacha",
    "Regional Almeidas y Guatavita",
    "Regional Alto Magdalena",
    "Regional Bajo Magdalena",
    "Regional Chiquinquirá",
    "Regional Gualivá",
    "Regional Magdalena Centro",
    "Regional Rionegro",
    "Regional Sabana Occidente",
    "Regional Sumapaz",
    "Regional Tequendama",
    "Regional Ubaté"
  ];

  const handleCreateFile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!effectiveClientId) {
      toast.error("Selecciona un cliente primero en la barra superior");
      return;
    }
    const formData = new FormData(e.currentTarget);
    const data = {
      clientId: effectiveClientId,
      internalCode: formData.get("internalCode"),
      authority: "CAR Cundinamarca",
      carRegional: formData.get("carRegional"),
      type: formData.get("type"),
    };

    setCreating(true);
    try {
      const res = await fetch("/api/expedientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Error al crear expediente");
      toast.success("Expediente creado");
      setIsModalOpen(false);
      mutate(key => typeof key === 'string' && key.startsWith('/api/expedientes'));
      mutate(key => typeof key === 'string' && key.startsWith('/api/dashboard'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setCreating(false);
    }
  };

  const mapStatus = (status: string) => {
    if (!status) return "En trámite";
    const s = status.toUpperCase();
    if (["PREPARATION", "DRAFT", "IN_REVIEW"].includes(s)) return "En proceso";
    if (["APPROVED"].includes(s)) return "Otorgado";
    if (["TRACKING", "FOLLOW_UP"].includes(s)) return "En seguimiento";
    return "En trámite";
  };

  const query = new URLSearchParams();
  if (effectiveClientId) query.set("clientId", effectiveClientId);
  if (search) query.set("q", search);
  
  const { data, error, isLoading: loading } = useSWR<any>(`/api/expedientes?${query.toString()}`, fetcher);
  const files = data?.items || [];

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FolderKanban className="h-6 w-6 text-erfor-green" />
            Gestión de Expedientes
          </h1>
          <p className="text-slate-500 text-sm mt-1">Expedientes ambientales ante autoridades competentes</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar expediente..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-erfor-green w-[240px]"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-erfor-green text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Expediente
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-erfor-green" />
        </div>
      ) : files.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
          <FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-slate-800">No hay expedientes</h3>
          <p className="text-slate-500 text-sm mt-1">No se encontraron expedientes para los filtros actuales.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {files.map((file: any) => {
            const displayStatus = mapStatus(file.status);
            
            return (
            <div 
              key={file.id} 
              onClick={() => router.push(`/expedientes/${file.id}`)}
              className="bg-white rounded-lg border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group cursor-pointer flex flex-col md:flex-row"
            >
              <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="inline-block px-2 py-1 bg-erfor-mist text-erfor-green font-bold text-xs rounded-md mb-2">
                      {file.officialCode || file.internalCode}
                    </span>
                    <h3 className="font-bold text-lg text-slate-800 leading-tight">
                      {file.property?.name || "Sin predio asociado"}
                    </h3>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                    displayStatus === "Otorgado" ? "bg-amber-100 text-amber-800" :
                    displayStatus === "En proceso" ? "bg-slate-100 text-slate-700" :
                    displayStatus === "En seguimiento" ? "bg-red-100 text-red-800" :
                    "bg-sky-100 text-sky-800"
                  }`}>
                    {displayStatus}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4 mt-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Propietario / Cliente</p>
                    <p className="text-sm font-medium text-slate-800 flex items-center mt-1">
                      <Building2 className="h-3 w-3 mr-1 text-slate-400" />
                      {file.client?.name || "N/D"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-semibold">Tipo de Permiso</p>
                    <p className="text-sm font-medium text-slate-800 flex items-center mt-1">
                      <FileArchive className="h-3 w-3 mr-1 text-slate-400" />
                      {file.type || "N/D"}
                    </p>
                  </div>
                </div>

                {/* 4 Items de Estado Específico */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <div className="bg-slate-50 rounded-md p-2 text-center border border-slate-100 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold leading-tight mb-1">En Proceso</p>
                    <p className="font-bold text-slate-800 text-lg leading-none">0</p>
                  </div>
                  <div className="bg-slate-50 rounded-md p-2 text-center border border-slate-100 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold leading-tight mb-1">En Trámite</p>
                    <p className="font-bold text-slate-800 text-lg leading-none">{file.procedures?.length || 0}</p>
                  </div>
                  <div className="bg-slate-50 rounded-md p-2 text-center border border-slate-100 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold leading-tight mb-1">Otorgado</p>
                    <p className="font-bold text-slate-800 text-lg leading-none">0</p>
                  </div>
                  <div className="bg-slate-50 rounded-md p-2 text-center border border-slate-100 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-slate-500 uppercase font-bold leading-tight mb-1">Seguimiento</p>
                    <p className="font-bold text-slate-800 text-lg leading-none">{file.procedures?.length || 0}</p>
                  </div>
                </div>

                
                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex flex-col text-slate-600 gap-1">
                    <span className="text-xs font-medium text-slate-500">
                      Autoridad: <span className="font-bold text-slate-700">{file.authority}</span>
                    </span>
                    {file.carRegional && (
                      <span className="text-xs font-medium text-slate-500">
                        Regional: <span className="font-bold text-slate-700">{file.carRegional}</span>
                      </span>
                    )}
                  </div>
                  <div className="text-erfor-green text-sm font-medium flex items-center group-hover:underline">
                    Ver Expediente <ChevronRight className="h-4 w-4 ml-0.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Modal Nuevo Expediente */}
      <NewExpedienteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => { window.location.reload(); }} 
      />
    </div>
  );
}
