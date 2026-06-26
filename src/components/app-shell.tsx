"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  ClipboardCheck,
  DatabaseZap,
  FileArchive,
  FileBarChart,
  FileCheck2,
  FolderKanban,
  Gauge,
  Home,
  Landmark,
  Leaf,
  Map,
  MessageSquareText,
  Plug,
  Search,
  Settings,
  ShieldCheck,
  Upload,
  UserRound,
  UsersRound,
  Wrench,
  Menu as MenuIcon,
  X,
  LogOut,
  User
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { AiPanel } from "@/components/ai-panel";
import { BrandLogo } from "@/components/brand-logo";
import { Menu, Transition, Dialog } from "@headlessui/react";
import toast from "react-hot-toast";
import { ClientSelector } from "./client-selector";
import { useClient } from "@/lib/client-context";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { GlobalSearch } from "./global-search";

import { NewExpedienteModal } from "./new-expediente-modal";

const nav = [
  { label: "Panel Maestro", href: "/dashboard", icon: Gauge },
  { label: "Clientes y Proyectos", href: "/clientes-y-proyectos", icon: UsersRound },
  { label: "Calendario y Alertas", href: "/calendario-y-alertas", icon: CalendarDays },
  { label: "IA Asistente Ambiental", href: "/ia-asistente-ambiental", icon: Bot },
  { label: "Configuración", href: "/configuracion", icon: Settings }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { selectedClientId } = useClient();
  const [hiddenAlerts, setHiddenAlerts] = useState<string[]>([]);
  
  const { data: alertsData } = useSWR<any[]>(
    `/api/notifications${selectedClientId ? `?clientId=${selectedClientId}` : ''}`, 
    fetcher, 
    { refreshInterval: 60000 }
  );

  const activeAlerts = (alertsData || []).filter(a => !hiddenAlerts.includes(a.id));

  const handleMarkAllAsRead = () => {
    if (alertsData) {
      setHiddenAlerts([...hiddenAlerts, ...alertsData.map(a => a.id)]);
    }
  };

  async function logout() {
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (response.ok) {
        router.push("/login");
        router.refresh();
      } else {
        toast.error("Error al cerrar sesión");
      }
    } catch (err) {
      toast.error("Error de conexión");
    }
  }

  const SidebarContent = () => (
    <>
      <div className="p-8">
        <BrandLogo variant="light" className="w-max" />
        <p className="mt-3 max-w-[210px] text-sm leading-5 text-white/78">Plataforma Integral de Asesoría Ambiental</p>
      </div>
      <nav className="erfor-scroll flex-1 overflow-y-auto px-2 pb-6">
        {nav.map((item) => {
          // Mejorado el chequeo de ruta activa
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`mb-1 flex items-center gap-3 rounded-md px-4 py-3 text-sm transition ${
                active ? "bg-erfor-green text-white shadow-lg shadow-green-950/20" : "text-white/78 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <div className="min-h-screen bg-[#f6f8f7] text-erfor-ink">
      {/* Sidebar Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[292px] flex-col bg-erfor-ink text-white lg:flex">
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <Transition.Root show={mobileMenuOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 lg:hidden" onClose={setMobileMenuOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-erfor-deep/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex w-full max-w-xs flex-1 flex-col bg-erfor-ink text-white">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button type="button" className="-m-2.5 p-2.5" onClick={() => setMobileMenuOpen(false)}>
                      <span className="sr-only">Cerrar menú</span>
                      <X className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="lg:pl-[292px]">
        <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/92 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-slate-700 lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Abrir menú lateral</span>
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div>
                <div className="mb-2 block lg:hidden">
                  <BrandLogo variant="dark" className="w-max" />
                </div>
                <h1 className="text-xl font-semibold hidden md:block">Bienvenido, <span className="text-erfor-green">Erwin Forero</span></h1>
                <p className="text-sm text-slate-500 hidden md:block">Panel de Control</p>
              </div>
            </div>
            
            <div className="flex flex-1 items-center justify-end gap-3">
              <div className="hidden md:block">
                <ClientSelector />
              </div>
              <div className="hidden md:block">
                <GlobalSearch />
              </div>

              {/* Notifications Dropdown */}
              <Menu as="div" className="relative ml-1">
                <Menu.Button as="button" title="Notificaciones" className="relative flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-erfor-green hover:text-erfor-green outline-none">
                  <Bell className="h-5 w-5" />
                  {activeAlerts.length > 0 && (
                    <span className="absolute right-2 top-2 flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 ring-2 ring-white"></span>
                    </span>
                  )}
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden flex flex-col">
                    <div className="bg-slate-50 border-b border-slate-200 p-3 flex justify-between items-center">
                      <h3 className="font-bold text-sm text-slate-800">
                        Centro de Notificaciones {activeAlerts.length > 0 && <span className="ml-1 text-xs font-semibold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">{activeAlerts.length}</span>}
                      </h3>
                      {activeAlerts.length > 0 && (
                        <span onClick={handleMarkAllAsRead} className="text-xs text-erfor-green font-medium cursor-pointer hover:underline">Marcar leídas</span>
                      )}
                    </div>
                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                      
                      {activeAlerts.length > 0 ? (
                        activeAlerts.map(alert => (
                          <div 
                            key={alert.id}
                            onClick={() => {
                              setHiddenAlerts([...hiddenAlerts, alert.id]);
                              if (alert.environmentalFile?.id) {
                                router.push(`/expedientes/${alert.environmentalFile.id}`);
                              }
                            }}
                            className="p-4 hover:bg-slate-50 transition cursor-pointer"
                          >
                            <div className="flex gap-3">
                              <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                                alert.severity === "HIGH" ? "bg-red-100 text-red-600" :
                                alert.severity === "MEDIUM" ? "bg-amber-100 text-amber-600" : "bg-sky-100 text-sky-600"
                              }`}>
                                {alert.severity === "HIGH" ? <AlertTriangle className="h-4 w-4" /> : 
                                 alert.severity === "MEDIUM" ? <FileCheck2 className="h-4 w-4" /> : <FolderKanban className="h-4 w-4" />}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-slate-800 line-clamp-1" title={alert.title}>{alert.title}</p>
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2" title={alert.description || ''}>{alert.description || "Sin descripción"}</p>
                                <p className="text-[10px] font-medium text-slate-400 mt-2">
                                  {alert.dueDate ? `Vence: ${new Date(alert.dueDate).toLocaleDateString('es-CO')}` : 'Sin fecha límite'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 flex flex-col items-center justify-center text-center">
                          <Bell className="h-8 w-8 text-slate-300 mb-2" />
                          <p className="text-sm font-semibold text-slate-600">Al día</p>
                          <p className="text-xs text-slate-500 mt-1">No tienes nuevas notificaciones en este momento.</p>
                        </div>
                      )}

                    </div>
                    <div className="bg-slate-50 border-t border-slate-200 p-2 text-center">
                      <Link href="/calendario-y-alertas" className="text-xs font-semibold text-erfor-green hover:underline">Ver todas las alertas</Link>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
              
              {/* Profile Dropdown */}
              <Menu as="div" className="relative ml-3">
                <Menu.Button className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-slate-100 transition outline-none">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-erfor-mist text-erfor-green">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <span className="hidden text-left text-sm md:block">
                    <span className="block font-semibold">Erwin Forero</span>
                    <span className="text-xs text-slate-500">Administrador</span>
                  </span>
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/perfil" className={`${active ? 'bg-slate-50 text-erfor-green' : 'text-slate-700'} flex items-center px-4 py-2 text-sm`}>
                          <User className="mr-3 h-4 w-4" />
                          Mi Perfil
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link href="/configuracion" className={`${active ? 'bg-slate-50 text-erfor-green' : 'text-slate-700'} flex items-center px-4 py-2 text-sm`}>
                          <Settings className="mr-3 h-4 w-4" />
                          Configuración
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button onClick={logout} className={`${active ? 'bg-red-50 text-red-600' : 'text-slate-700'} flex w-full items-center px-4 py-2 text-sm`}>
                          <LogOut className="mr-3 h-4 w-4" />
                          Cerrar Sesión
                        </button>
                      )}
                    </Menu.Item>
                  </Menu.Items>
                </Transition>
              </Menu>

            </div>
          </div>
        </header>
        {children}
      </div>
      <AiPanel />
    </div>
  );
}

function IconButton({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <button title={title} className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 transition hover:border-erfor-green hover:text-erfor-green">
      {children}
    </button>
  );
}

export function QuickActions() {
  const [isExpedienteModalOpen, setIsExpedienteModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);

  return (
    <>
      <div className="w-full">
        <div className="w-full overflow-hidden rounded-lg bg-erfor-green/90 text-white shadow-soft backdrop-blur transition hover:bg-erfor-green">
          <button 
            onClick={() => setIsExpedienteModalOpen(true)} 
            className="flex w-full items-center justify-center gap-3 py-3 px-4 transition group"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-erfor-green transition group-hover:scale-110">
              <UsersRound className="h-4 w-4" />
            </span>
            <span className="text-base font-semibold">Crear Nuevo Cliente</span>
          </button>
        </div>
      </div>
      <NewExpedienteModal 
        isOpen={isExpedienteModalOpen} 
        onClose={() => setIsExpedienteModalOpen(false)} 
        onSuccess={() => { window.location.reload(); }} 
      />
    </>
  );
}
