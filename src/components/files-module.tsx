"use client";

import { useState, useEffect } from "react";
import { useClient } from "@/lib/client-context";
import { Loader2, Search, Plus, FolderKanban, ChevronRight, Building2, FileArchive, X } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export function FilesModule({ clientId }: { clientId?: string }) {
  const { selectedClientId } = useClient();
  const effectiveClientId = clientId || selectedClientId;
  const router = useRouter();
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
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
      // Recargar expedientes
      setSearch(search + " ");
      setTimeout(() => setSearch(search.trim()), 0);
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (effectiveClientId) query.set("clientId", effectiveClientId);
        if (search) query.set("q", search);
        
        const res = await fetch(`/api/expedientes?${query.toString()}`);
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
  }, [effectiveClientId, search]);

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
          {files.map(file => {
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
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-bold text-lg text-slate-800">Crear Nuevo Expediente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateFile} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código Interno / Nombre</label>
                <input required name="internalCode" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-erfor-green outline-none" placeholder="Ej: EXP-2026-001" />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Regional CAR</label>
                <select required name="carRegional" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-erfor-green outline-none bg-white">
                  <option value="">Seleccione una regional...</option>
                  {CAR_REGIONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Permiso / Trámite principal</label>
                <select required name="type" className="w-full border border-slate-200 rounded-md px-3 py-2 text-sm focus:border-erfor-green outline-none bg-white">
                  <option value="">Seleccione...</option>
                  <option value="Concesión de Aguas Subterráneas">Concesión de Aguas Subterráneas</option>
                  <option value="Concesión de Aguas Superficiales">Concesión de Aguas Superficiales</option>
                  <option value="Permiso de Vertimientos">Permiso de Vertimientos</option>
                  <option value="Aprovechamiento Forestal">Aprovechamiento Forestal</option>
                  <option value="Ocupación de Cauce">Ocupación de Cauce</option>
                  <option value="Licencia Ambiental">Licencia Ambiental</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={creating} className="flex items-center gap-2 px-4 py-2 bg-erfor-green text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors disabled:opacity-70">
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  Crear Expediente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
