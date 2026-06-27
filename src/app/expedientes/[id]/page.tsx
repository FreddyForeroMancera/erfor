"use client";

import { useState, use, Fragment } from "react";
import useSWR, { mutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { Dialog, Transition } from "@headlessui/react";
import { AppShell } from "@/components/app-shell";
import { Loader2, ArrowLeft, FolderKanban, FileBarChart, FileArchive, Leaf, Upload, FileCheck, FileCheck2, Calendar, X, Check, Trash2 } from "lucide-react";
import { ObligationsModule } from "@/components/obligations-module";
import { ConsumptionReportsModule } from "@/components/consumption-reports-module";
import { PueaaAdvancesModule } from "@/components/pueaa-advances-module";
import { CalendarModule } from "@/components/calendar-module";
import { PhotoGalleryModule } from "@/components/photo-gallery-module";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { NewTaskModal } from "@/components/new-task-modal";
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
  const { data: dashboardData, isLoading: dashLoading } = useSWR<any>("/api/dashboard", fetcher);
  const { data: file, isLoading: fileLoading } = useSWR<any>(`/api/expedientes/${resolvedParams.id}`, fetcher);
  
  const loading = dashLoading || fileLoading;
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("En Proceso");
  const [pendingStatusChange, setPendingStatusChange] = useState<string | null>(null);

  const confirmStatusChange = () => {
    if (pendingStatusChange) {
      setCurrentStatus(pendingStatusChange);
      mutate(key => typeof key === 'string' && key.startsWith('/api/dashboard'));
      mutate(key => typeof key === 'string' && key.startsWith('/api/expedientes'));
      toast.success(`Estado actualizado a: ${pendingStatusChange}`);
      setPendingStatusChange(null);
    }
  };

  const [documents, setDocuments] = useState([
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
  ]);
  const [docToDelete, setDocToDelete] = useState<any>(null);

  const handleDeleteDocument = () => {
    if (docToDelete) {
      setDocuments(prev => prev.filter(d => d.id !== docToDelete.id));
      toast.success("Documento eliminado correctamente");
      setDocToDelete(null);
    }
  };

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
        <div className="mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {[
            { label: "Cotizaciones", sub: "Presupuestos y Propuestas", icon: FolderKanban, color: "text-erfor-green", activeColor: "border-erfor-green bg-green-50/50 ring-1 ring-erfor-green" },
            { label: "En Proceso", sub: "Preparación y Revisión", icon: FileBarChart, color: "text-indigo-600", activeColor: "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600" },
            { label: "En Trámite", sub: "Ante autoridades", icon: FileCheck2, color: "text-sky-600", activeColor: "border-sky-600 bg-sky-50/50 ring-1 ring-sky-600" },
            { label: "Otorgado", sub: "Permisos y Licencias", icon: FileArchive, color: "text-amber-500", activeColor: "border-amber-500 bg-amber-50/50 ring-1 ring-amber-500" },
            { label: "En Seguimiento", sub: "Vigilancia de Obligaciones", icon: Calendar, color: "text-red-600", activeColor: "border-red-600 bg-red-50/50 ring-1 ring-red-600" },
          ].map(({ label, sub, icon: Component, color, activeColor }) => {
            const isActive = currentStatus === label;
            return (
              <article 
                key={label}
                onClick={() => {
                  if (currentStatus !== label) {
                    setPendingStatusChange(label);
                  }
                }}
                className={`relative cursor-pointer rounded-lg border p-5 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md ${isActive ? activeColor : 'border-slate-200 bg-white hover:border-slate-300'}`}
              >
                {isActive && (
                  <div className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white shadow">
                    <Check className="h-4 w-4" />
                  </div>
                )}
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`font-bold ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>{label}</p>
                    <p className="mt-1 text-xs text-slate-500">{sub}</p>
                    {isActive ? (
                      <span className="mt-4 inline-block rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold text-slate-800 shadow-sm border border-slate-200">Estado Actual</span>
                    ) : (
                      <span className="mt-4 inline-block text-xs font-medium text-slate-400">Clic para activar</span>
                    )}
                  </div>
                  {!isActive && <Component className={`mt-1 h-8 w-8 ${color} opacity-70 transition-transform group-hover:scale-110`} />}
                </div>
              </article>
            );
          })}
        </div>

        <section className="flex flex-col gap-4">
            {/* Detalles del Expediente (Reemplaza Gráficas) */}
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-800 border-b pb-2">Datos del Expediente</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
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

                <div className="col-span-full border-t border-slate-100 my-1 pt-4">
                   <h4 className="font-bold text-slate-700 text-sm">Datos del Cliente</h4>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">NOMBRE CLIENTE</p>
                  <p className="font-medium text-slate-800 mt-1">{file.client?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">TIPO PERSONA</p>
                  <p className="font-medium text-slate-800 mt-1">{file.client?.type || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">IDENTIFICACION</p>
                  <p className="font-medium text-slate-800 mt-1">{file.client?.documentType ? `${file.client.documentType} ` : ""}{file.client?.documentNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">CORREO ELECTRONICO</p>
                  <p className="font-medium text-slate-800 mt-1">{file.client?.email || "-"}</p>
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
                  <p className="text-xs font-semibold text-slate-500 uppercase">FECHA DE REGISTRO</p>
                  <p className="font-medium text-slate-800 mt-1">{file.client?.createdAt ? new Date(file.client.createdAt).toLocaleDateString('es-CO') : "-"}</p>
                </div>

                <div className="col-span-full border-t border-slate-100 my-1 pt-4">
                   <h4 className="font-bold text-slate-700 text-sm">Datos del Predio</h4>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">NOMBRE DE LA FINCA</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">MUNICIPIO</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.city || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">VEREDA</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.village || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">AREA (HA)</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.area ? `${file.property.area} ha` : "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">CEDULA CATASTRAL</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.cadastralCode || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">MATRICULA INMOBILIARIA</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.realEstateRegistration || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">ADMINISTRADOR</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.owner || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase">TEL. ADMINISTRADOR</p>
                  <p className="font-medium text-slate-800 mt-1">{file.property?.notes ? file.property.notes.replace('Teléfono del administrador: ', '') : "-"}</p>
                </div>
              </div>
            </section>

            <ObligationsModule fileId={resolvedParams.id} />
            <ConsumptionReportsModule fileId={resolvedParams.id} />
            <PueaaAdvancesModule fileId={resolvedParams.id} />

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
                {documents.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-3 transition hover:bg-slate-50 cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-50 p-2 rounded-md border border-slate-100">
                        <DocumentIcon type={item.type} className="h-5 w-5 text-erfor-green" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 line-clamp-1">{item.name}</p>
                        <p className="text-xs text-slate-500">{item.type} • {item.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider shrink-0 ${
                        item.status === 'VIGENTE' || item.status === 'APROBADO' || item.status === 'PAGADO' ? 'bg-green-100 text-green-700' :
                        item.status === 'POR VENCER' ? 'bg-amber-100 text-amber-700' :
                        item.status === 'ARCHIVADO' ? 'bg-slate-100 text-slate-600' :
                        'bg-sky-100 text-sky-700'
                      }`}>
                        {item.status}
                      </span>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setDocToDelete(item); }} 
                        className="text-slate-300 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100"
                        title="Eliminar documento"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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
              action={<button onClick={() => setIsNewTaskModalOpen(true)} className="text-xs bg-erfor-green text-white px-2 py-1 rounded hover:bg-green-700 transition">Crear Tarea</button>}
              items={[
                { title: "Radicar respuesta a requerimiento CAR", sub: `${file?.officialCode || file?.internalCode || "Expediente"} • Cliente: ${file?.client?.name || "No asignado"}`, date: "2026-06-20", type: "Trámite CAR", priority: "🔴 Alta", assignee: "Abogado / Jurídico", requiresDocument: true, description: "Se debe entregar radicado oficial de respuesta al requerimiento." },
                { title: "Actualizar Plan de Contingencia", sub: `${file?.officialCode || file?.internalCode || "Expediente"} • Cliente: ${file?.client?.name || "No asignado"}`, date: "2026-06-25", type: "Informe", priority: "🟡 Media", assignee: "Ingeniero Residente", description: "Revisar anexos cartográficos y actualizar firmas responsables." },
                { title: "Pago de Tasa por Uso de Agua", sub: `${file?.officialCode || file?.internalCode || "Expediente"} • Cliente: ${file?.client?.name || "No asignado"}`, date: "2026-07-01", type: "Financiero", priority: "🔴 Alta", assignee: "Responsabilidad del Cliente", requiresDocument: true, description: "Subir comprobante de pago emitido por la entidad." },
                { title: "Preparar informe de monitoreo", sub: `${file?.officialCode || file?.internalCode || "Expediente"} • Cliente: ${file?.client?.name || "No asignado"}`, date: "2026-07-10", type: "Monitoreo", priority: "🟡 Media", assignee: "Auditor Ambiental", description: "Recopilar resultados de laboratorio y cruzar contra norma." },
                { title: "Visita de inspección ocular programada", sub: `${file?.officialCode || file?.internalCode || "Expediente"} • Cliente: ${file?.client?.name || "No asignado"}`, date: "2026-07-15", type: "Visita Técnica", priority: "🟡 Media", assignee: "Ingeniero Residente" }
              ]} 
            />
            <SideList title="Alertas" href="/calendario-y-alertas" items={(dashboardData?.alerts || []).map((item: any) => ({ title: item.title, sub: item.description || item.severity, date: item.dueDate?.slice(0, 10) }))} />

        </section>

      </div>
      
      <NewTaskModal 
        isOpen={isNewTaskModalOpen} 
        onClose={() => setIsNewTaskModalOpen(false)} 
        onSuccess={() => window.location.reload()} 
      />

      <Transition appear show={!!pendingStatusChange} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={() => setPendingStatusChange(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                  <div className="px-6 py-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 mb-4">
                      <FileCheck className="h-6 w-6 text-amber-600" />
                    </div>
                    <Dialog.Title as="h3" className="text-lg font-bold text-slate-800">
                      Confirmar Cambio de Estado
                    </Dialog.Title>
                    <div className="mt-2">
                      <p className="text-sm text-slate-500">
                        ¿Estás seguro que deseas cambiar el estado de este expediente a <span className="font-bold text-slate-800">{pendingStatusChange}</span>?
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-50 px-6 py-4 flex items-center justify-center gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none"
                      onClick={() => setPendingStatusChange(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-erfor-green px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none"
                      onClick={confirmStatusChange}
                    >
                      Sí, cambiar estado
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      <DeleteConfirmationModal 
        isOpen={!!docToDelete} 
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDeleteDocument}
        itemName={docToDelete?.name}
      />
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

type SideListItem = {
  title: string;
  sub: string;
  date?: string;
  type?: string;
  priority?: string;
  assignee?: string;
  requiresDocument?: boolean;
  description?: string;
};

function SideList({ title, items, href, action }: { title: string; items: SideListItem[]; href?: string; action?: React.ReactNode }) {
  const [selectedItem, setSelectedItem] = useState<SideListItem | null>(null);

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
          <div 
            key={`${item.title}-${index}`} 
            className="group py-3 text-sm transition hover:bg-slate-50 cursor-pointer"
            onClick={() => setSelectedItem(item)}
          >
            <div className="flex justify-between gap-3">
              <p className="font-semibold transition group-hover:text-erfor-green">{item.title}</p>
              <span className="shrink-0 text-xs text-slate-500">{item.date || ""}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">{item.sub}</p>
          </div>
        )) : <p className="py-4 text-sm text-slate-500">Sin registros.</p>}
      </div>

      <Transition appear show={!!selectedItem} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={() => setSelectedItem(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                  <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-lg font-bold text-slate-800">
                      Detalle del Registro
                    </Dialog.Title>
                    <button onClick={() => setSelectedItem(null)} className="text-slate-400 hover:text-slate-600 transition">
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="px-6 py-6 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">Título</p>
                      <p className="font-semibold text-slate-800 mt-1">{selectedItem?.title}</p>
                    </div>
                    {selectedItem?.type && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase">Tipo</p>
                          <p className="font-medium text-slate-800 mt-1">{selectedItem.type}</p>
                        </div>
                        {selectedItem.priority && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Prioridad</p>
                            <p className="font-medium text-slate-800 mt-1">{selectedItem.priority}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {selectedItem?.assignee && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase">Asignado a</p>
                          <p className="font-medium text-slate-800 mt-1">{selectedItem.assignee}</p>
                        </div>
                        {selectedItem.date && (
                          <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase">Fecha Límite</p>
                            <p className="font-medium text-slate-800 mt-1">{selectedItem.date}</p>
                          </div>
                        )}
                      </div>
                    )}
                    {(!selectedItem?.assignee && selectedItem?.date) && (
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Fecha Límite</p>
                        <p className="font-medium text-slate-800 mt-1">{selectedItem.date}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase">{selectedItem?.description ? "Descripción / Detalles" : "Descripción / Referencia"}</p>
                      <p className="text-slate-700 mt-1">{selectedItem?.description || selectedItem?.sub}</p>
                    </div>
                    {selectedItem?.requiresDocument && (
                      <div className="p-3 bg-blue-50 border border-blue-100 rounded-md">
                        <p className="text-xs font-medium text-blue-800 flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                          Requiere cargar comprobante o radicado al finalizar.
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={() => setSelectedItem(null)} className="px-4 py-2 bg-slate-200 text-slate-800 font-medium rounded-lg hover:bg-slate-300 transition text-sm">
                      Cerrar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
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
