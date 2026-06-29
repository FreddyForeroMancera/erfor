"use client";

import { useState } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { Loader2, Search, Plus, Building2, UserX, Trash2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import Link from "next/link";
import { NewClientModal } from "./new-client-modal";

export function ClientsModule() {
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

  const { data, error, isLoading } = useSWR<any>("/api/clients", fetcher);
  const clients = data?.items || [];

  const filteredClients = clients.filter((c: any) => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.documentNumber?.includes(search) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDeactivate = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas desactivar este cliente? Su usuario perderá acceso al portal.")) return;
    
    setDeactivatingId(id);
    try {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Error al desactivar el cliente");
      
      toast.success("Cliente desactivado exitosamente");
      mutate("/api/clients");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setDeactivatingId(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 xl:p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="h-6 w-6 text-erfor-green" />
            Directorio de Clientes
          </h1>
          <p className="text-slate-500 text-sm mt-1">Gestión de empresas y usuarios con acceso al portal</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, NIT o correo..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:border-erfor-green w-[260px]"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-erfor-green text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cliente
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-erfor-green" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-4">Cliente / Empresa</th>
                  <th className="px-6 py-4">Documento</th>
                  <th className="px-6 py-4">Contacto</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      No se encontraron clientes.
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client: any) => (
                    <tr key={client.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4">
                        <Link href={`/clientes/${client.id}`} className="font-medium text-erfor-green hover:text-green-700 hover:underline">
                          {client.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        {client.documentType || 'NIT'} {client.documentNumber || 'N/D'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-700">{client.contactPerson || 'Sin contacto'}</span>
                          <span className="text-xs text-slate-500">{client.email || 'Sin correo'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {client.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-600"></span> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-3 items-center">
                        <Link 
                          href={`/clientes/${client.id}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-erfor-green transition"
                          title="Ver Hoja de Vida"
                        >
                          Ver Detalle <ArrowRight className="h-4 w-4" />
                        </Link>
                        {client.status === 'ACTIVE' && (
                          <button
                            onClick={() => handleDeactivate(client.id)}
                            disabled={deactivatingId === client.id}
                            className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50 border-l border-slate-200 pl-3"
                            title="Desactivar acceso"
                          >
                            {deactivatingId === client.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserX className="h-4 w-4" />}
                            Suspender
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <NewClientModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => mutate("/api/clients")} 
      />
    </div>
  );
}
