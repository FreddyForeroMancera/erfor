"use client";

import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { FolderKanban, AlertTriangle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { ProjectTimeline } from "@/components/project-timeline";

export default function PortalDashboard() {
  const { data, error, isLoading } = useSWR('/api/portal/dashboard', fetcher);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando tu información...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error al cargar el portal. Contacta a soporte.</div>;

  const { projects = [], alerts = [] } = data || {};

  return (
    <main className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">Resumen de tus Proyectos</h2>
        <p className="text-slate-500 mt-1">Aquí puedes hacer seguimiento al estado de tus trámites y requerimientos vigentes.</p>
      </div>

      {alerts.length > 0 && (
        <div className="mb-8 p-4 bg-red-50 border border-red-100 rounded-xl">
          <h3 className="flex items-center gap-2 font-semibold text-red-800 mb-3">
            <AlertTriangle className="h-5 w-5" /> Tienes alertas que requieren atención
          </h3>
          <div className="grid gap-3">
            {alerts.map((alert: any) => (
              <div key={alert.id} className="bg-white p-3 rounded-lg shadow-sm border border-red-100 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-slate-800 text-sm">{alert.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-1">{alert.description}</p>
                </div>
                {alert.projectId && (
                  <Link href={`/portal/proyectos/${alert.projectId}`} className="text-xs font-semibold text-erfor-green hover:underline">
                    Ver proyecto
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-2 p-12 bg-white rounded-xl border border-slate-200 text-center shadow-sm">
            <FolderKanban className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-700">No tienes proyectos activos</p>
            <p className="text-slate-500 mt-1">Cuando ERFOR inicie un trámite a tu nombre, aparecerá aquí.</p>
          </div>
        ) : (
          projects.map((project: any) => (
            <div key={project.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="inline-flex items-center rounded-md bg-sky-50 px-2 py-1 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-700/10 mb-2">
                    {project.type}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">{project.name}</h3>
                  <p className="text-sm text-slate-500">{project.location || 'Ubicación no especificada'}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wide">Progreso del Trámite</p>
                <ProjectTimeline status={project.status} />
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
                <div className="text-sm text-slate-500">
                  {project.obligations?.length || 0} obligaciones registradas
                </div>
                <Link 
                  href={`/portal/proyectos/${project.id}`}
                  className="flex items-center gap-2 text-sm font-semibold text-erfor-green hover:text-green-700 transition"
                >
                  Ver detalles <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
