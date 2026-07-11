"use client";

import { useState } from "react";
import { Search, Plus, MoreVertical, FileText, User } from "lucide-react";
import { GlobalNewTramiteModal } from "./global-new-tramite-modal";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import toast from "react-hot-toast";
import { DeleteConfirmationModal } from "./delete-confirmation-modal";

type Item = {
  id: string;
  type: string;
  authority: string;
  status: string;
  internalCode: string | null;
  project: { name: string } | null;
  client: { name: string } | null;
};

const COLUMNS = [
  { id: "DRAFT", title: "Cotizaciones" }
];

export function QuotesProceduresKanban({ initialData, onRefresh }: { initialData: Item[], onRefresh: () => void }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Secure Deletion States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Item | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: userData } = useSWR<any>("/api/auth/me", fetcher);
  const currentUser = userData?.user;
  const canDeleteUser = currentUser?.role === "SUPER_ADMIN" || currentUser?.role === "DIRECTOR_AMBIENTAL";

  const handleDeleteQuote = async () => {
    if (!selectedForDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/expedientes/${selectedForDelete.id}`, {
        method: "DELETE"
      });
      if (!res.ok) throw new Error("Error al eliminar la cotización");
      toast.success("Cotización eliminada correctamente");
      setIsDeleteModalOpen(false);
      setSelectedForDelete(null);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "No se pudo eliminar la cotización");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredItems = initialData.filter(p => 
    p.type?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.internalCode && p.internalCode.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.client?.name && p.client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (p.project?.name && p.project.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50 p-4 lg:p-6 xl:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cotizaciones (Presupuestos y Propuestas)</h1>
          <p className="mt-1 text-sm text-slate-500">Supervisa las cotizaciones antes de convertirlas en trámites.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:border-erfor-green">
            <Search className="h-4 w-4 text-slate-400" />
            <input 
              className="bg-transparent text-sm outline-none placeholder:text-slate-400 w-full sm:w-48"
              placeholder="Buscar cotización o trámite..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-md bg-erfor-green px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-erfor-green/90"
          >
            <Plus className="h-4 w-4" />
            Nueva Cotización
          </button>
        </div>
      </div>

      <div className="erfor-scroll flex flex-1 gap-6 overflow-x-auto pb-4">
        {COLUMNS.map((col) => {
          const colItems = filteredItems.filter(p => p.status === col.id);

          return (
            <div key={col.id} className="flex h-full w-[300px] shrink-0 flex-col rounded-xl bg-slate-100/80 p-3 border border-slate-200/50">
              <div className="mb-3 flex items-center justify-between px-1 border-b border-slate-200 pb-2">
                <h3 className="font-bold text-slate-700">{col.title}</h3>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-600 shadow-sm">
                  {colItems.length}
                </span>
              </div>
              <div className="erfor-scroll flex-1 space-y-3 overflow-y-auto pr-1">
                {colItems.map((item) => (
                  <article 
                    key={item.id} 
                    onClick={() => router.push(`/expedientes/${item.id}`)}
                    className="group cursor-pointer rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:border-erfor-green hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <span className="inline-block rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-indigo-700">
                        {item.type}
                      </span>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === item.id ? null : item.id);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {activeMenuId === item.id && (
                          <>
                            <div 
                              className="fixed inset-0 z-10" 
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(null);
                              }}
                            />
                            <div className="absolute right-0 mt-1 w-44 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-20 overflow-hidden border border-slate-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMenuId(null);
                                  router.push(`/expedientes/${item.id}`);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                              >
                                Ver Detalle
                              </button>
                              {canDeleteUser && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(null);
                                    setSelectedForDelete(item);
                                    setIsDeleteModalOpen(true);
                                  }}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition border-t border-slate-100"
                                >
                                  Eliminar Cotización
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="mt-3 text-sm font-bold text-slate-800 leading-tight">
                      {item.project?.name || "Sin Asignar"}
                    </p>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="truncate">{item.client?.name || "Cliente no asignado"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <FileText className="h-3.5 w-3.5 text-slate-400" />
                        <span>{item.internalCode ? `${item.internalCode}` : "Sin Código"}</span>
                      </div>
                    </div>
                  </article>
                ))}
                
                {colItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-24 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50">
                    <span className="text-xs font-medium text-slate-400">Sin registros</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <GlobalNewTramiteModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={onRefresh}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedForDelete(null);
        }}
        onConfirm={handleDeleteQuote}
        title="Eliminar Cotización"
        itemName={selectedForDelete?.type || "esta cotización"}
        isDeleting={isDeleting}
        requireDoubleConfirmation={true}
        doubleConfirmationLabel="Entiendo que esta acción es permanente y que se eliminarán de forma definitiva todos los registros asociados a esta cotización en la plataforma."
      />
    </div>
  );
}
