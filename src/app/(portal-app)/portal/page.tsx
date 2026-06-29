"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { FolderKanban, AlertTriangle, ArrowRight, FileCheck, Clock, MapPin, Building2, Bell } from "lucide-react";
import Link from "next/link";
import { ProjectTimeline } from "@/components/project-timeline";

export default function PortalDashboard() {
  const { data, error, isLoading } = useSWR('/api/portal/dashboard', fetcher);

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-erfor-green border-t-transparent"></div>
        <p className="mt-4 text-sm font-medium text-slate-500">Cargando tu información...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex h-[60vh] items-center justify-center">
      <div className="flex max-w-sm flex-col items-center text-center p-8 bg-red-50 rounded-2xl border border-red-100">
        <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
        <h3 className="font-bold text-red-800">Error de conexión</h3>
        <p className="text-sm text-red-600 mt-2">No pudimos cargar la información de tu portal. Por favor, contacta a soporte si el problema persiste.</p>
      </div>
    </div>
  );

  const { projects = [], alerts = [] } = data || {};

  const activeProjectsCount = projects.filter((p: any) => p.status !== "COMPLETED" && p.status !== "ARCHIVED").length;
  const completedProjectsCount = projects.length - activeProjectsCount;

  return (
    <main className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header and Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Estado General</h2>
          <p className="text-slate-500 mt-1">Resumen de tus expedientes y trámites ambientales con ERFOR.</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[140px]">
            <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Activos</p>
              <p className="text-2xl font-bold text-slate-800 leading-none">{activeProjectsCount}</p>
            </div>
          </div>
          
          <div className="bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 min-w-[140px]">
            <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
              <FileCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Otorgados</p>
              <p className="text-2xl font-bold text-slate-800 leading-none">{completedProjectsCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="p-5 bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Bell className="h-24 w-24" />
          </div>
          <div className="relative z-10">
            <h3 className="flex items-center gap-2 font-bold text-red-800 mb-4 text-lg">
              <AlertTriangle className="h-5 w-5" /> Requieren tu atención ({alerts.length})
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {alerts.map((alert: any) => (
                <div key={alert.id} className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-red-100/50 flex flex-col justify-between hover:bg-white transition shadow-sm">
                  <div>
                    <div className="flex items-start justify-between">
                      <p className="font-bold text-slate-800 text-sm mb-1">{alert.title}</p>
                      {alert.dueDate && (
                        <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                          <Clock className="h-3 w-3" />
                          {new Date(alert.dueDate).toLocaleDateString('es-CO')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{alert.description}</p>
                  </div>
                  {alert.projectId && (
                    <Link href={`/portal/proyectos/${alert.projectId}`} className="mt-3 text-sm font-semibold text-erfor-green hover:text-green-700 flex items-center gap-1 w-max transition">
                      Ir al proyecto <ArrowRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Projects Grid */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Building2 className="h-5 w-5 text-erfor-green" />
          Tus Expedientes
        </h3>
        
        <div className="grid lg:grid-cols-2 gap-6">
          {projects.length === 0 ? (
            <div className="col-span-2 p-16 bg-white rounded-2xl border border-dashed border-slate-300 text-center flex flex-col items-center">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <FolderKanban className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-xl font-semibold text-slate-700 mb-2">Aún no tienes trámites activos</p>
              <p className="text-slate-500 max-w-md">Cuando nuestro equipo técnico inicie la gestión de un nuevo expediente ambiental a tu nombre, podrás hacerle seguimiento desde aquí.</p>
            </div>
          ) : (
            projects.map((project: any) => {
              const isCompleted = project.status === "COMPLETED" || project.status === "APPROVED";
              
              return (
                <div key={project.id} className="group relative bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-erfor-green/50 transition-all duration-300 flex flex-col h-full">
                  
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-5">
                    <div>
                      <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 mb-3">
                        {project.type || "Proyecto"}
                      </span>
                      <h3 className="text-xl font-bold text-slate-800 leading-tight mb-2 group-hover:text-erfor-green transition-colors">
                        {project.name}
                      </h3>
                      {project.location && (
                        <p className="text-sm text-slate-500 flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {project.location}
                        </p>
                      )}
                    </div>
                    {isCompleted ? (
                      <div className="h-10 w-10 rounded-full bg-green-50 flex items-center justify-center shrink-0" title="Otorgado / Finalizado">
                        <FileCheck className="h-5 w-5 text-green-600" />
                      </div>
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-sky-50 flex items-center justify-center shrink-0" title="En Trámite">
                        <FolderKanban className="h-5 w-5 text-sky-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* Timeline Preview */}
                  <div className="mb-6 flex-1 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 mb-3 uppercase tracking-widest">Fase del Trámite</p>
                    <ProjectTimeline status={project.status} />
                  </div>

                  {/* Card Footer / Action */}
                  <div className="pt-4 border-t border-slate-100 flex justify-between items-center mt-auto">
                    <div className="flex gap-4">
                      <div className="text-sm">
                        <span className="font-bold text-slate-700">{project.obligations?.length || 0}</span>
                        <span className="text-slate-500 ml-1">Obligaciones</span>
                      </div>
                      <div className="text-sm">
                        <span className="font-bold text-slate-700">{project.procedures?.length || 0}</span>
                        <span className="text-slate-500 ml-1">Permisos</span>
                      </div>
                    </div>
                    <Link 
                      href={`/portal/proyectos/${project.id}`}
                      className="flex items-center gap-1.5 text-sm font-bold text-erfor-green bg-erfor-mist px-4 py-2 rounded-lg hover:bg-erfor-green hover:text-white transition-colors"
                    >
                      Ver Detalle
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
