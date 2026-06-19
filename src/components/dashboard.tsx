"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarDays, FileArchive, FileBarChart, FileCheck2, FolderKanban, Leaf, UsersRound, Loader2, Building2, Map } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { QuickActions } from "@/components/app-shell";
import toast from "react-hot-toast";
import { useClient } from "@/lib/client-context";
import { QuotesModal } from "@/components/quotes-modal";

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
  const [isQuotesModalOpen, setIsQuotesModalOpen] = useState(false);

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
        { label: "COTIZACIONES", value: data?.kpis.enProceso || 0, sub: "Presupuestos y Propuestas", icon: FolderKanban, color: "text-erfor-green" },
        { label: "En Trámite", value: data?.kpis.enTramite || 0, sub: "Ante autoridades", icon: FileCheck2, color: "text-sky-600" },
        { label: "Otorgado", value: data?.kpis.otorgado || 0, sub: "Permisos y Licencias", icon: FileArchive, color: "text-amber-500" },
        { label: "En Seguimiento", value: data?.kpis.enSeguimiento || 0, sub: "Vigilancia de Obligaciones", icon: CalendarDays, color: "text-red-600" },
      ];
    },
    [data, selectedClientId]
  );



  return (
    <main className="p-4 lg:p-6 xl:p-8">
      <section className="flex flex-col gap-4">
        <div>
          <div className="relative overflow-hidden rounded-lg bg-erfor-ink p-7 text-white shadow-soft">
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,29,34,.98),rgba(7,29,34,.72)),url('https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=1600&auto=format&fit=crop')]" />
            <div className="relative flex w-full">
              <QuickActions />
            </div>
          </div>

          <div className="mt-6 mb-3">
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Estado</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              const isCotizaciones = label === "COTIZACIONES";
              return (
                <article 
                  key={String(label)} 
                  className={`group rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md ${isCotizaciones ? "cursor-pointer ring-1 ring-transparent hover:ring-erfor-green hover:border-erfor-green" : ""}`}
                  onClick={() => isCotizaciones && setIsQuotesModalOpen(true)}
                >
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

          {/* Listado de Alertas General */}
          <div className="mt-4">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Listado de Alertas General
              </h3>
              <div className="flex flex-col gap-3">
                {loading ? (
                  <div className="flex justify-center p-4"><Loader2 className="animate-spin h-6 w-6 text-slate-500" /></div>
                ) : data?.alerts && data.alerts.length > 0 ? (
                  data.alerts.map(alert => {
                    const severityColors: Record<string, string> = {
                      CRITICAL: "bg-red-100 text-red-600 border-red-200",
                      HIGH: "bg-orange-100 text-orange-600 border-orange-200",
                      MEDIUM: "bg-amber-100 text-amber-600 border-amber-200",
                      LOW: "bg-blue-100 text-blue-600 border-blue-200"
                    };
                    return (
                      <div key={alert.id} className="flex items-start gap-4 p-4 rounded-md border border-slate-200 bg-white hover:bg-slate-50 transition shadow-sm">
                        <div className={`mt-0.5 h-10 w-10 rounded-full flex items-center justify-center shrink-0 border ${severityColors[alert.severity] || "bg-slate-100 text-slate-600"}`}>
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">{alert.title}</p>
                          {alert.description && <p className="text-sm text-slate-600 mt-1">{alert.description}</p>}
                          {alert.dueDate && <p className="text-xs text-slate-500 mt-2 font-medium">Vence: {new Date(alert.dueDate).toLocaleDateString("es-CO", { year: 'numeric', month: 'long', day: 'numeric' })}</p>}
                        </div>
                        <div className="shrink-0 flex items-center">
                           <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${severityColors[alert.severity] || "bg-slate-100 text-slate-600"}`}>
                             {alert.severity === 'CRITICAL' ? 'Crítica' : alert.severity === 'HIGH' ? 'Alta' : alert.severity === 'MEDIUM' ? 'Media' : 'Baja'}
                           </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-slate-500 text-center py-8 bg-slate-50 rounded-lg border border-slate-100">No hay alertas activas en este momento.</p>
                )}
              </div>
            </article>
          </div>
        </div>
        

      </section>

      <QuotesModal 
        isOpen={isQuotesModalOpen} 
        onClose={() => setIsQuotesModalOpen(false)} 
      />
    </main>
  );
}
