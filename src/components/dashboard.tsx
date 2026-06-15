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
        { label: "Clientes Activos", value: data?.kpis.clients || 0, sub: "Cartera gestionada", icon: UsersRound, color: "text-erfor-green" },
        { label: "Predios Activos", value: data?.kpis.projects || 0, sub: "Áreas bajo manejo", icon: Map, color: "text-erfor-green" },
        { label: "Trámites en Curso", value: data?.kpis.procedures || 0, sub: "Ante autoridades", icon: FileCheck2, color: "text-sky-600" },
        { label: "Alertas Críticas", value: data?.kpis.alerts || 0, sub: "Requieren atención inmediata", icon: AlertTriangle, color: "text-red-600" },
      ];
    },
    [data, selectedClientId]
  );

  const obligations = (data?.charts.obligationsByCategory || []).map((item) => ({ name: item.category, value: item._count }));
  const procedures = (data?.charts.proceduresByStatus || []).map((item) => ({ name: item.status.replaceAll("_", " "), value: item._count }));
  const filesByAuth = (data?.charts.filesByAuthority || []).map((item) => ({ name: item.authority || "ND", value: item._count }));
  
  const complianceData = [
    { name: "Completadas", value: data?.kpis.completedObligations || 0 },
    { name: "Pendientes", value: data?.kpis.obligations || 0 }
  ];

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
            {loading ? Array.from({ length: 8 }).map((_, i) => (
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

          <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.25fr_1fr]">
            <ChartCard title={selectedClientId ? "Cumplimiento del Predio" : "Trámites por Autoridad"}>
              <ResponsiveContainer width="100%" height={210}>
                {selectedClientId ? (
                  <PieChart>
                    <Pie data={complianceData.some(d => d.value > 0) ? complianceData : [{ name: "Sin datos", value: 1 }]} innerRadius={58} outerRadius={86} dataKey="value">
                      <Cell fill={colors[0]} />
                      <Cell fill={colors[3]} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                ) : (
                  <PieChart>
                    <Pie data={filesByAuth.length ? filesByAuth : [{ name: "Sin datos", value: 1 }]} innerRadius={58} outerRadius={86} dataKey="value">
                      {(filesByAuth.length ? filesByAuth : [{ name: "Sin datos" }]).map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Obligaciones por Categoría">
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={obligations.length ? obligations : [{ name: "Sin datos", value: 0 }]}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#0f7a3d" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Trámites por Estado">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={procedures.length ? procedures : [{ name: "Sin datos", value: 1 }]} innerRadius={58} outerRadius={86} dataKey="value">
                    {(procedures.length ? procedures : [{ name: "Sin datos" }]).map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="font-semibold">Integraciones y Fuentes de Información</h3>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
              {loading ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-md border border-slate-200 p-4">
                  <div className="mb-3 h-8 w-8 rounded bg-slate-200"></div>
                  <div className="mb-2 h-4 w-3/4 rounded bg-slate-200"></div>
                  <div className="mb-4 h-3 w-1/2 rounded bg-slate-200"></div>
                  <div className="h-8 w-full rounded bg-slate-200"></div>
                </div>
              )) : (data?.integrations || []).map((item) => (
                <div key={item.id} className="rounded-md border border-slate-200 p-4 transition hover:border-erfor-green hover:shadow-sm">
                  <DatabaseIcon type={item.type} />
                  <p className="mt-3 text-sm font-semibold">{item.name}</p>
                  <p className="mt-2 text-xs text-slate-500">{typeTranslations[item.type] || item.type.replaceAll("_", " ")}</p>
                  <p className="mt-4 rounded-md bg-erfor-mist py-2 text-center text-xs font-semibold text-erfor-green">{statusTranslations[item.status] || item.status}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <SideList title="Tareas Próximas" loading={loading} items={(data?.tasks || []).map((item) => ({ title: item.title, sub: item.client?.name || "ERFOR", date: item.dueDate?.slice(0, 10) }))} />
          <SideList title="Alertas Recientes" loading={loading} items={(data?.alerts || []).map((item) => ({ title: item.title, sub: item.description || item.severity, date: item.dueDate?.slice(0, 10) }))} />
          <SideList title="Actividad Reciente" loading={loading} items={(data?.recentActivity || []).map((item) => ({ title: item.action, sub: item.description, date: new Date(item.createdAt).toLocaleDateString("es-CO") }))} />
          <div className="rounded-lg bg-erfor-green p-6 text-white shadow-soft">
            <h3 className="font-semibold">¿Necesitas ayuda?</h3>
            <p className="mt-2 text-sm text-white/82">Nuestro asistente IA puede ayudarte con consultas ambientales y normativas.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function SideList({ title, items, loading }: { title: string; items: { title: string; sub: string; date?: string }[], loading?: boolean }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <span className="cursor-pointer text-xs font-semibold text-erfor-green hover:underline">Ver todas</span>
      </div>
      <div className="divide-y divide-slate-100">
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse py-3 text-sm">
            <div className="mb-2 h-4 w-3/4 rounded bg-slate-200"></div>
            <div className="h-3 w-1/2 rounded bg-slate-200"></div>
          </div>
        )) : items.length ? items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="group py-3 text-sm transition hover:bg-slate-50">
            <div className="flex justify-between gap-3">
              <p className="font-semibold transition group-hover:text-erfor-green">{item.title}</p>
              <span className="shrink-0 text-xs text-slate-500">{item.date || ""}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
          </div>
        )) : <p className="py-4 text-sm text-slate-500">Sin registros todavía.</p>}
      </div>
    </section>
  );
}

function DatabaseIcon({ type }: { type: string }) {
  const iconClass = "h-8 w-8 text-erfor-green";
  if (type.includes("EXCEL")) return <FileBarChart className={iconClass} />;
  if (type.includes("IMAGE")) return <FileArchive className={iconClass} />;
  return <DatabaseZap className={iconClass} />;
}

function DatabaseZap(props: { className?: string }) {
  return <Leaf {...props} />;
}
