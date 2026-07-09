"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Cloud, File, Plus, Loader2, MoreVertical, Search, CheckCircle2, AlertCircle, HardDrive } from "lucide-react";

export function DocumentsModule({ environmentalFileId, clientId, initialDocuments }: { environmentalFileId: string, clientId?: string, initialDocuments: any[] }) {
  const [search, setSearch] = useState("");
  const [quota, setQuota] = useState<{ usedBytes: number, quotaBytes: number, percentage: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/documents/quota")
      .then(r => r.json())
      .then(data => {
        if (!data.error) setQuota(data);
      })
      .catch(() => {});
  }, []);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const toastId = toast.loading(`Subiendo y analizando "${file.name}"...`);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("environmentalFileId", environmentalFileId);
      if (clientId) formData.append("clientId", clientId);
      formData.append("category", "Documento ambiental");

      const res = await fetch("/api/documents/upload", { method: "POST", body: formData });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Error ${res.status} al subir el documento`);
      }
      toast.success("Documento subido y analizado", { id: toastId });
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || "No se pudo subir el documento", { id: toastId, duration: 8000 });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const filteredDocs = initialDocuments.filter(doc => 
    doc.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Integración Cloud — Próximamente */}
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
            <Cloud className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-700 text-sm">Almacenamiento Físico (ERFOR)</h3>
            {quota ? (
              <p className="text-xs text-slate-500 mt-0.5">
                Has usado {(quota.usedBytes / 1024 / 1024).toFixed(1)} MB de {(quota.quotaBytes / 1024 / 1024).toFixed(0)} MB gratuitos.
              </p>
            ) : (
              <p className="text-xs text-slate-500 mt-0.5">Calculando espacio disponible...</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {quota && (
            <div className="w-32 bg-slate-200 rounded-full h-2.5">
              <div 
                className={`h-2.5 rounded-full ${quota.percentage > 85 ? 'bg-red-500' : quota.percentage > 70 ? 'bg-amber-400' : 'bg-erfor-green'}`} 
                style={{ width: `${quota.percentage}%` }}
              ></div>
            </div>
          )}
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-500 shadow-sm">
            <HardDrive className="h-3.5 w-3.5 text-slate-400" />
            Supabase Storage
          </span>
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
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,application/pdf"
          className="hidden"
          onChange={handleFileSelected}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-erfor-green text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition shadow-sm disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {uploading ? "Subiendo..." : "Subir Archivo Local"}
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
                      {doc.fileUrl && doc.fileUrl !== 'PURGED' ? (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="font-medium text-erfor-green hover:underline transition">
                          {doc.name}
                        </a>
                      ) : (
                        <span className="font-medium text-slate-700">{doc.name}</span>
                      )}
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
                    {doc.fileUrl === 'PURGED' ? (
                      <span className="inline-flex items-center gap-1.5 text-erfor-green text-xs font-bold bg-green-50 px-2 py-1 rounded-md" title="El archivo físico fue eliminado para ahorrar espacio, pero sus metadatos están analizados">
                        <CheckCircle2 className="h-4 w-4" /> Analizado y Purgado
                      </span>
                    ) : doc.oneDriveSyncStatus === 'SYNCED' ? (
                      <span className="inline-flex items-center gap-1.5 text-blue-600 text-xs font-bold bg-blue-50 px-2 py-1 rounded-md" title="Sincronizado con OneDrive">
                        <Cloud className="h-4 w-4" /> Sincronizado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-bold bg-slate-50 px-2 py-1 rounded-md" title="Archivo físico guardado en Supabase">
                        <AlertCircle className="h-4 w-4" /> En Supabase
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
