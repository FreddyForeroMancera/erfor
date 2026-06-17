"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, FileArchive, FileBarChart, FileCheck2, FolderKanban, Leaf, UsersRound, Loader2, Building2, Map } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { QuickActions } from "@/components/app-shell";
import toast from "react-hot-toast";
import { useClient } from "@/lib/client-context";

type DashboardData = {
  kpis: Record<string, number>;
  charts: {
    obligationsByCategory: { category: string; _count: number }[];
    proceduresByStatus: { status: string; _count: number }[];
    filesByAuthority: { authority: string; _count: number }[];
  };
  tasks: { id: string; title: string; dueDate?: string; client?: { name: string } }[];
  alerts: { id: string; title: string; description?: string; severity: string; dueDate?: string }[];
  recentActivity: { id: string; action: string; description: string; createdAt: string }[];
  integrations: { id: string; name: string; type: string; status: string }[];
};

const colors = ["#0f7a3d", "#0ea5e9", "#f59e0b", "#dc2626", "#6b7280"];

const typeTranslations: Record<string, string> = {
  AUTHORITY_LINKS: "Enlaces Oficiales (CAR)",
  EXCEL: "Archivos de Cálculo",
  IMAGES: "Repositorio Fotográfico",
  GOOGLE_SHEETS: "Sincronización en la Nube",
  LEGAL_REPOSITORY: "Repositorio Normativo",
  EXTERNAL_SOURCE: "Sistemas Externos (SINA)"
};

const statusTranslations: Record<string, string> = {
  CONFIGURED: "Configurado",
  CONNECTED: "Conectado",
  READY: "Listo para Uso",
  PENDING_VALIDATION: "Pendiente"
};

export function Dashboard() {
  const { selectedClientId } = useClient();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const url = selectedClientId ? `/api/dashboard?clientId=${selectedClientId}` : "/api/dashboard";
    fetch(url)
      .then(async (res) => {
        if (!res.ok) throw new Error("Error fetching data");
        return res.json();
      })
      .then(setData)
      .catch((err) => toast.error("Error al cargar el dashboard: " + err.message))
      .finally(() => setLoading(false));
  }, [selectedClientId]);

  const kpis = useMemo<{ label: string; value: number; sub: string; icon: LucideIcon; color: string }[]>(
    () => {
      if (selectedClientId) {
        return [
          { label: "Expedientes Ambientales", value: data?.kpis.files || 0, sub: "Carpetas vivas", icon: FolderKanban, color: "text-sky-600" },
          { label: "Obligaciones Pendientes", value: data?.kpis.obligations || 0, sub: "Del Plan de Manejo", icon: CalendarDays, color: "text-amber-500" },
          { label: "Requerimientos Abiertos", value: data?.kpis.requirements || 0, sub: "Requieren respuesta", icon: AlertTriangle, color: "text-red-600" },
          { label: "Visitas e Inspecciones", value: data?.kpis.visits || 0, sub: "Registros en campo", icon: Building2, color: "text-erfor-green" },
        ];
      }
      return [
        { label: "En Proceso", value: data?.kpis.enProceso || 0, sub: "Preparación y Revisión", icon: FolderKanban, color: "text-erfor-green" },
        { label: "En Trámite", value: data?.kpis.enTramite || 0, sub: "Ante autoridades", icon: FileCheck2, color: "text-sky-600" },
        { label: "Otorgado", value: data?.kpis.otorgado || 0, sub: "Permisos y Licencias", icon: FileArchive, color: "text-amber-500" },
        { label: "En Seguimiento", value: data?.kpis.enSeguimiento || 0, sub: "Vigilancia de Obligaciones", icon: CalendarDays, color: "text-red-600" },
      ];
    },
    [data, selectedClientId]
  );



  return (
    <main className="p-4 lg:p-6 xl:p-8">
      <section className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div>
          <div className="relative overflow-hidden rounded-lg bg-erfor-ink p-7 text-white shadow-soft">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,29,34,.98),rgba(7,29,34,.72)),url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop')]" />
            <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-xl">
                <p className="text-sm text-white/86">Plataforma integral para la gestión ambiental</p>
                <h2 className="mt-2 text-2xl font-semibold">Cumplimiento, sostenibilidad y confianza</h2>
                <p className="mt-5 max-w-lg text-sm leading-7 text-white/78">
                  Administra clientes, proyectos, obligaciones, trámites, documentos y reportes ambientales de forma integrada y automatizada.
                </p>
              </div>
              <QuickActions />
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {loading ? Array.from({ length: 4 }).map((_, i) => (
              <article key={i} className="animate-pulse rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="w-full">
                    <div className="mb-4 h-4 w-1/2 rounded bg-slate-200"></div>
                    <div className="mb-3 h-8 w-1/3 rounded bg-slate-200"></div>
                    <div className="h-3 w-2/3 rounded bg-slate-200"></div>
                  </div>
                  <div className="mt-6 h-8 w-8 rounded-full bg-slate-200"></div>
                </div>
              </article>
            )) : kpis.map(({ label, value, sub, icon: Component, color }) => {
              return (
                <article key={String(label)} className="group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-600">{label}</p>
                      <p className="mt-4 text-3xl font-bold">{String(value)}</p>
                      <p className="mt-3 text-xs text-slate-500">{sub}</p>
                    </div>
                    <Component className={`mt-6 h-8 w-8 ${color} transition group-hover:scale-110`} />
                  </div>
                </article>
              );
            })}
          </div>

          {/* Sección de Gráficos movida dentro de la columna izquierda para evitar el espacio en blanco */}
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm h-[320px] flex flex-col">
              <h3 className="font-semibold text-slate-800 mb-4">Estado de Trámites</h3>
              <div className="flex-1 min-h-0">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-500"><Loader2 className="animate-spin h-6 w-6" /></div>
                ) : data?.charts.proceduresByStatus.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.charts.proceduresByStatus}
                        dataKey="_count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                      >
                        {data.charts.proceduresByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [value, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">Sin datos de trámites</div>
                )}
              </div>
            </article>

            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm h-[320px] flex flex-col">
              <h3 className="font-semibold text-slate-800 mb-4">Obligaciones por Categoría</h3>
              <div className="flex-1 min-h-0">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-slate-500"><Loader2 className="animate-spin h-6 w-6" /></div>
                ) : data?.charts.obligationsByCategory.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.charts.obligationsByCategory}>
                      <XAxis dataKey="category" tick={{fontSize: 10}} interval={0} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="_count" fill="#0f7a3d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-sm text-slate-500">Sin datos de obligaciones</div>
                )}
              </div>
            </article>
          </div>
        </div>
        
        {/* Panel lateral derecho para Actividad Reciente */}
        <aside className="space-y-4">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-800">Actividad Reciente</h3>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="py-8 text-center text-slate-500 text-sm">Cargando actividad...</div>
              ) : data?.recentActivity.length ? (
                data.recentActivity.map((act) => (
                  <div key={act.id} className="py-3 last:pb-0">
                    <p className="text-sm font-medium text-slate-800">{act.action}</p>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">{act.description}</p>
                    <p className="text-[10px] text-slate-400 mt-2">{new Date(act.createdAt).toLocaleString("es-CO")}</p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-slate-500 text-sm">No hay actividad reciente</div>
              )}
            </div>
          </section>
        </aside>
      </section>

    </main>
  );
}
