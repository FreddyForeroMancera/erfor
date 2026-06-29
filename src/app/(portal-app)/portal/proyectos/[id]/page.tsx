"use client";

import { use, useState, useRef } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { 
  ArrowLeft, FileText, CheckCircle2, Clock, CalendarDays, 
  MapPin, AlertTriangle, FileArchive, Download, Upload
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ProjectTimeline } from "@/components/project-timeline";

export default function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { data, error, isLoading, mutate } = useSWR<any>(`/api/portal/proyectos/${resolvedParams.id}`, fetcher);
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-erfor-green border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Cargando detalles del proyecto...</p>
      </div>
    </div>
  );
  
  if (error || !data?.project) return (
    <div className="flex h-[60vh] items-center justify-center p-4">
      <div className="flex max-w-sm flex-col items-center text-center p-8 bg-red-50 rounded-2xl border border-red-100">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
        <h3 className="font-bold text-red-800">No se pudo cargar el expediente</h3>
        <p className="text-sm text-red-600 mt-2">Verifica que el enlace sea correcto o contacta a soporte.</p>
        <Link href="/portal" className="mt-6 text-sm font-semibold bg-white border border-red-200 text-red-700 px-4 py-2 rounded-lg shadow-sm">
          Volver al inicio
        </Link>
      </div>
    </div>
  );

  const { project } = data;

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
      mutate(); // Recargar datos
    } catch (err) {
      toast.error("Ocurrió un error al cargar el documento");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <main className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6">
      <Link href="/portal" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition">
        <ArrowLeft className="h-4 w-4" /> Volver al dashboard
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 mb-4">
              {project.type || "Expediente / Proyecto"}
            </span>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-800 leading-tight mb-3">
              {project.name}
            </h1>
            <div className="flex flex-wrap gap-4 text-sm text-slate-500">
              {project.location && (
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {project.location}</span>
              )}
              {project.environmentalAuthority && (
                <span className="flex items-center gap-1.5"><FileArchive className="h-4 w-4" /> {project.environmentalAuthority}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <p className="text-xs uppercase font-bold tracking-widest text-slate-400">Consultor Asignado</p>
            <p className="font-semibold text-slate-800">{project.responsible?.name || "Equipo ERFOR"}</p>
            {project.responsible?.email && <p className="text-sm text-slate-500">{project.responsible.email}</p>}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Clock className="h-5 w-5 text-erfor-green" />
              Línea de Tiempo del Trámite
            </h2>
            <div className="pl-2">
              <ProjectTimeline status={project.status} />
            </div>
            
            {project.procedures && project.procedures.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-700 uppercase mb-4">Permisos Asociados</h3>
                <div className="space-y-3">
                  {project.procedures.map((proc: any) => (
                    <div key={proc.id} className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <p className="font-bold text-slate-800">{proc.type}</p>
                        <p className="text-xs text-slate-500 mt-1">Radicado: {proc.filingNumber || "N/D"}</p>
                      </div>
                      <span className="bg-white border border-slate-200 text-xs font-semibold px-2.5 py-1 rounded-md text-slate-700 shadow-sm">
                        {proc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Upload Widget */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-sky-100 text-sky-600 flex items-center justify-center">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Carga de Documentación</h3>
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

        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          {/* Obligations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-erfor-green" />
              Tus Obligaciones
            </h2>
            
            {!project.obligations || project.obligations.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No hay obligaciones registradas para este proyecto.</p>
            ) : (
              <div className="space-y-3">
                {project.obligations.map((obs: any) => {
                  const isDone = obs.status === "CUMPLIDO";
                  const isLate = obs.status === "NO_CUMPLIDO";
                  return (
                    <div key={obs.id} className={`p-4 rounded-xl border ${isDone ? 'bg-green-50/50 border-green-100' : isLate ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-200'} transition`}>
                      <div className="flex gap-3">
                        <div className={`mt-0.5 shrink-0 ${isDone ? 'text-green-500' : isLate ? 'text-red-500' : 'text-slate-300'}`}>
                          {isDone ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current" />}
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${isDone ? 'text-green-800 line-through opacity-80' : 'text-slate-800'}`}>{obs.title}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {obs.dueDate && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded ${isDone ? 'bg-green-100 text-green-700' : isLate ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                                <CalendarDays className="h-3 w-3" /> Vence: {new Date(obs.dueDate).toLocaleDateString('es-CO')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-erfor-green" />
              Documentos
            </h2>
            
            {!project.documents || project.documents.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">No hay documentos compartidos.</p>
            ) : (
              <div className="space-y-2">
                {project.documents.map((doc: any) => (
                  <a key={doc.id} href={doc.fileUrl} target="_blank" rel="noreferrer" className="group flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-slate-200 hover:bg-slate-50 transition">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-8 w-8 rounded bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <p className="font-semibold text-sm text-slate-800 truncate">{doc.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">{doc.category || "General"}</p>
                      </div>
                    </div>
                    <div className="text-slate-400 group-hover:text-erfor-green">
                      <Download className="h-4 w-4" />
                    </div>
                  </a>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}
