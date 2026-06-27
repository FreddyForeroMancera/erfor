"use client";

import { use, useState, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { ArrowLeft, FileText, Upload, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function PortalProjectDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data: project, isLoading, mutate } = useSWR(`/api/expedientes/${resolvedParams.id}`, fetcher);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando detalles del proyecto...</div>;
  if (!project) return <div className="p-8 text-center text-red-500">Proyecto no encontrado.</div>;

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", project.id);
    
    try {
      const res = await fetch("/api/portal/upload", {
        method: "POST",
        body: formData
      });
      
      if (!res.ok) throw new Error("Error al subir archivo");
      
      toast.success("Documento cargado exitosamente");
      mutate(); // Recargar datos si es necesario
    } catch (err) {
      toast.error("Ocurrió un error al cargar el documento");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <main className="p-4 lg:p-8 max-w-5xl mx-auto">
      <Link href="/portal" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition">
        <ArrowLeft className="h-4 w-4" /> Volver a mis proyectos
      </Link>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
        <div className="bg-erfor-ink p-6 text-white">
          <span className="inline-flex items-center rounded-md bg-white/20 px-2 py-1 text-xs font-medium text-white mb-3">
            {project.type}
          </span>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="text-white/70 mt-1">{project.location || 'Ubicación no especificada'}</p>
        </div>
        
        <div className="p-6">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wide mb-4">Obligaciones Pendientes</h3>
          {(!project.obligations || project.obligations.length === 0) ? (
             <p className="text-sm text-slate-500 bg-slate-50 p-4 rounded-lg">No hay obligaciones vigentes para este proyecto.</p>
          ) : (
            <ul className="space-y-3">
              {project.obligations.map((ob: any) => (
                <li key={ob.id} className="flex gap-3 p-4 rounded-lg border border-slate-200 bg-slate-50">
                  <div className="shrink-0 mt-0.5">
                    {ob.status === 'CUMPLIDO' ? <CheckCircle2 className="h-5 w-5 text-erfor-green" /> :
                     ob.status === 'PENDIENTE' ? <Clock className="h-5 w-5 text-amber-500" /> : 
                     <AlertCircle className="h-5 w-5 text-red-500" />}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{ob.title}</p>
                    <p className="text-xs text-slate-600 mt-1">{ob.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Carga de Documentación</h3>
            <p className="text-sm text-slate-500">Sube aquí los soportes o recibos requeridos por tu consultor.</p>
          </div>
        </div>
        
        <div className="mt-4">
          <label className={`block w-full border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-erfor-green hover:bg-green-50 transition ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
            <FileText className="h-8 w-8 text-slate-400 mx-auto mb-3" />
            <span className="block text-sm font-medium text-slate-700">
              {isUploading ? "Subiendo archivo..." : "Haz clic para seleccionar un archivo PDF, JPG o PNG"}
            </span>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
          </label>
        </div>
      </div>
    </main>
  );
}
