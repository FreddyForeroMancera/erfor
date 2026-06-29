"use client";

import { useState } from "react";
import { Cloud, File, ExternalLink, Plus, MoreVertical, Search, CheckCircle2, AlertCircle } from "lucide-react";

export function DocumentsModule({ environmentalFileId, initialDocuments }: { environmentalFileId: string, initialDocuments: any[] }) {
  const [search, setSearch] = useState("");
  
  // Enfoque A: Simulamos el enlace a una carpeta compartida (OneDrive)
  const [oneDriveLink, setOneDriveLink] = useState("https://onedrive.live.com/erfor-client-folder");

  const filteredDocs = initialDocuments.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* OneDrive Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Cloud className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-bold text-blue-900 text-lg">Sincronización con OneDrive</h3>
            <p className="text-sm text-blue-700 mt-0.5">Los archivos de este expediente están vinculados a tu nube corporativa.</p>
          </div>
        </div>
        <div className="flex gap-3 shrink-0">
          <a 
            href={oneDriveLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            Abrir Carpeta <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar documento..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-erfor-green focus:ring-1 focus:ring-erfor-green transition"
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-erfor-green text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition shadow-sm">
          <Plus className="h-4 w-4" />
          Subir Archivo Local
        </button>
      </div>

      {/* Documents Table */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
            <tr>
              <th className="px-6 py-4">Nombre del Archivo</th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Fecha Subida</th>
              <th className="px-6 py-4 text-center">Estado Nube</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredDocs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <File className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No hay documentos registrados.</p>
                  <p className="text-xs text-slate-400 mt-1">Sube archivos localmente o vincúlalos desde OneDrive.</p>
                </td>
              </tr>
            ) : (
              filteredDocs.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-slate-50/50 transition group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-400">
                        <File className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-slate-700 group-hover:text-erfor-green transition">{doc.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-semibold">
                      {doc.category || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {new Date(doc.createdAt).toLocaleDateString('es-CO')}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {doc.oneDriveSyncStatus === 'SYNCED' ? (
                      <span className="inline-flex items-center gap-1.5 text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded-md" title="Sincronizado con OneDrive">
                        <CheckCircle2 className="h-4 w-4" /> Sincronizado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md" title="Solo Local">
                        <AlertCircle className="h-4 w-4" /> Local
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-erfor-green hover:bg-slate-100 rounded-lg transition">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
