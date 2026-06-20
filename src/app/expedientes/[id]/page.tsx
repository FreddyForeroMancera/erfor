"use client";

import { useEffect, useState, use } from "react";
import { AppShell } from "@/components/app-shell";
import { Loader2, ArrowLeft, FolderKanban, FileBarChart, FileArchive, Leaf, Upload, FileCheck, Calendar } from "lucide-react";
import { ObligationsModule } from "@/components/obligations-module";
import { CalendarModule } from "@/components/calendar-module";
import { PhotoGalleryModule } from "@/components/photo-gallery-module";
import Link from "next/link";
import toast from "react-hot-toast";
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

export default function FileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [file, setFile] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const resDash = await fetch("/api/dashboard");
        const dashData = await resDash.json();
        setDashboardData(dashData);

        const resFile = await fetch(`/api/expedientes/${resolvedParams.id}`);
        const fileData = await resFile.json();
        setFile(fileData);
      } catch (err: any) {
        toast.error("Error al cargar detalles: " + err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-erfor-green" />
        </div>
      </AppShell>
    );
  }

  if (!file) {
    return (
      <AppShell>
        <div className="p-8 text-center">
          <p>Expediente no encontrado</p>
          <Link href="/clientes-y-proyectos" className="text-erfor-green hover:underline">Volver a Clientes</Link>
        </div>
      </AppShell>
    );
  }

  const obligations = (dashboardData?.charts?.obligationsByCategory || []).map((item: any) => ({ name: item.category, value: item._count }));
  const complianceData = [
    { name: "Completadas", value: dashboardData?.kpis?.completedObligations || 0 },
    { name: "Pendientes", value: dashboardData?.kpis?.obligations || 0 }
  ];

  return (
    <AppShell>
      <div className="p-4 lg:p-6 xl:p-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href={`/clientes/${file.clientId}`} className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 hover:border-erfor-green hover:text-erfor-green transition">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FolderKanban className="h-6 w-6 text-erfor-green" />
              {file.officialCode || file.internalCode}
            </h1>
            <p className="text-sm text-slate-500">
              {file.client?.name} • {file.property?.name} • {file.authority}
            </p>
          </div>
        </div>

        {/* ESTADO KPI Cards */}
        <div className="mb-3 mt-2">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Estado</h2>
        </div>
        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600">En Proceso</p>
                <p className="mt-4 text-3xl font-bold">0</p>
                <p className="mt-3 text-xs text-slate-500">Preparación y Revisión</p>
              </div>
              <FolderKanban className="mt-6 h-8 w-8 text-erfor-green" />
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600">En Trámite</p>
                <p className="mt-4 text-3xl font-bold">{file.procedures?.length || 0}</p>
                <p className="mt-3 text-xs text-slate-500">Ante autoridades</p>
              </div>
              <FileBarChart className="mt-6 h-8 w-8 text-sky-600" />
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600">Otorgado</p>
                <p className="mt-4 text-3xl font-bold">0</p>
                <p className="mt-3 text-xs text-slate-500">Permisos y Licencias</p>
              </div>
              <FileCheck className="mt-6 h-8 w-8 text-amber-500" />
            </div>
          </article>
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-600">En Seguimiento</p>
                <p className="mt-4 text-3xl font-bold">{file.procedures?.length || 0}</p>
                <p className="mt-3 text-xs text-slate-500">Vigilancia de Obligaciones</p>
              </div>
              <Calendar className="mt-6 h-8 w-8 text-red-600" />
            </div>
          </article>
        </div>

        <section className="flex flex-col gap-4">
            {/* Detalles del Expediente (Reemplaza Gráficas) */}
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-800 border-b pb-2">Datos del Expediente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">EXPEDIENTE</p>
                  <p className="font-medium text-slate-800 mt-1">{file.officialCode || file.internalCode || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">DIRECCION REGIONAL</p>
                  <p className="font-medium text-slate-800 mt-1">{file.carRegional || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">TIPO DE EXPEDIENTE</p>
                  <p className="font-medium text-slate-800 mt-1">{file.type === "SANCIONATORIO" ? "Sancionatorio" : "Permisivo"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">NOMBRE CLIENTE</p>
                  <p className="font-medium text-slate-800 mt-1">{file.client?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">IDENTIFICACION</p>
                  <p className="font-medium text-slate-800 mt-1">{file.client?.documentNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">DIRECCION</p>
                  <p className="font-medium text-slate-800 mt-1">{file.client?.address || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">TELEFONO</p>
                  <p className="font-medium text-slate-800 mt-1">{file.client?.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">NOMBRE DE LA FINCA</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">CEDULA CATASTRAL</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.cadastralCode || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">MATRICULA INMOBILIARIA</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.realEstateRegistration || "-"}</p>
                </div>
                <div className="md:col-span-2 xl:col-span-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase">TRAMITE (PERMISOS)</p>
                  {file.procedures && file.procedures.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {file.procedures.map((proc: any) => (
                        <span key={proc.id} className="inline-flex items-center rounded-md bg-erfor-green/10 px-2 py-1 text-xs font-medium text-erfor-green ring-1 ring-inset ring-erfor-green/20">
                          {proc.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium text-slate-800 mt-1">-</p>
                  )}
                </div>
              </div>
            </section>

            <ObligationsModule fileId={resolvedParams.id} />

            {/* Documentos del Expediente */}
            <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">Documentos del Expediente</h3>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Top 10</span>
                </div>
                <div className="relative">
                  <input 
                    type="file" 
                    id="document-upload" 
                    className="hidden" 
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        toast.success(`Simulando subida de: ${e.target.files[0].name}`);
                        e.target.value = ''; // reset
                      }
                    }}
                  />
                  <label 
                    htmlFor="document-upload"
                    className="flex cursor-pointer items-center gap-2 rounded-md bg-erfor-green px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-erfor-green/90"
                  >
                    <Upload className="h-4 w-4" />
                    Subir Documento
                  </label>
                </div>
              </div>
              <div className="flex flex-col border border-slate-100 rounded-md divide-y divide-slate-100">
                {[
                  { id: 1, name: "Escritura Pública", type: "PREDIAL", status: "VIGENTE", date: "2023-01-15" },
                  { id: 2, name: "Certificado de Libertad y Tradición", type: "PREDIAL", status: "ACTUALIZADO", date: "2024-02-10" },
                  { id: 3, name: "Estudio de Impacto Ambiental", type: "AMBIENTAL", status: "APROBADO", date: "2023-08-22" },
                  { id: 4, name: "Plan de Manejo Ambiental (PMA)", type: "AMBIENTAL", status: "EN SEGUIMIENTO", date: "2023-09-01" },
                  { id: 5, name: "Resolución de Concesión de Aguas", type: "RESOLUCIÓN", status: "VIGENTE", date: "2022-11-05" },
                  { id: 6, name: "Informe de Monitoreo de Vertimientos", type: "INFORME", status: "ENTREGADO", date: "2024-01-20" },
                  { id: 7, name: "Permiso de Emisiones Atmosféricas", type: "PERMISO", status: "POR VENCER", date: "2026-05-14" },
                  { id: 8, name: "Concepto Técnico CAR", type: "CAR", status: "RECIBIDO", date: "2024-03-12" },
                  { id: 9, name: "Registro Fotográfico Inspección", type: "ANEXO", status: "ARCHIVADO", date: "2023-12-05" },
                  { id: 10, name: "Comprobante de Pago Tasa Retributiva", type: "FINANCIERO", status: "PAGADO", date: "2024-04-01" },
                ].map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 transition hover:bg-slate-50 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                        <DocumentIcon type={item.type} className="h-5 w-5 text-erfor-green" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.type} • {item.date}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                      item.status === 'VIGENTE' || item.status === 'APROBADO' || item.status === 'PAGADO' ? 'bg-green-100 text-green-700' :
                      item.status === 'POR VENCER' ? 'bg-amber-100 text-amber-700' :
                      item.status === 'ARCHIVADO' ? 'bg-slate-100 text-slate-600' :
                      'bg-sky-100 text-sky-700'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </section>
            
            <PhotoGalleryModule fileId={resolvedParams.id} />

            <section className="mt-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <CalendarModule fileId={resolvedParams.id} embedded={true} />
            </section>

            <SideList 
              title="Tareas del Expediente" 
              href="/calendario-y-alertas" 
              action={<button className="text-xs bg-erfor-green text-white px-2 py-1 rounded hover:bg-green-700 transition">Crear Tarea</button>}
              items={[
                { title: "Radicar respuesta a requerimiento CAR", sub: file?.officialCode || file?.internalCode || "Expediente", date: "2026-06-20" },
                { title: "Actualizar Plan de Contingencia", sub: file?.officialCode || file?.internalCode || "Expediente", date: "2026-06-25" },
                { title: "Pago de Tasa por Uso de Agua", sub: file?.officialCode || file?.internalCode || "Expediente", date: "2026-07-01" },
                { title: "Preparar informe de monitoreo", sub: file?.officialCode || file?.internalCode || "Expediente", date: "2026-07-10" },
                { title: "Visita de inspección ocular programada", sub: file?.officialCode || file?.internalCode || "Expediente", date: "2026-07-15" }
              ]} 
            />
            <SideList title="Alertas" href="/calendario-y-alertas" items={(dashboardData?.alerts || []).map((item: any) => ({ title: item.title, sub: item.description || item.severity, date: item.dueDate?.slice(0, 10) }))} />

        </section>

      </div>
    </AppShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm h-full">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function SideList({ title, items, href, action }: { title: string; items: { title: string; sub: string; date?: string }[]; href?: string; action?: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">{title}</h3>
          {action}
        </div>
        {href ? (
          <Link href={href} className="text-xs font-semibold text-erfor-green hover:underline">Ver</Link>
        ) : (
          <span className="cursor-pointer text-xs font-semibold text-erfor-green hover:underline">Ver</span>
        )}
      </div>
      <div className="divide-y divide-slate-100">
        {items.length ? items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="group py-3 text-sm transition hover:bg-slate-50">
            <div className="flex justify-between gap-3">
              <p className="font-semibold transition group-hover:text-erfor-green">{item.title}</p>
              <span className="shrink-0 text-xs text-slate-500">{item.date || ""}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
          </div>
        )) : <p className="py-4 text-sm text-slate-500">Sin registros.</p>}
      </div>
    </section>
  );
}

function DocumentIcon({ type, className }: { type: string; className?: string }) {
  const iconClass = className || "h-8 w-8 text-erfor-green";
  if (type.includes("PREDIAL")) return <FileArchive className={iconClass} />;
  if (type.includes("AMBIENTAL") || type.includes("RESOLUCIÓN") || type.includes("PERMISO")) return <Leaf className={iconClass} />;
  return <FileBarChart className={iconClass} />;
}

function DatabaseZap(props: { className?: string }) {
  return <Leaf {...props} />;
}
