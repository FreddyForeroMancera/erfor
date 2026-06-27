"use client";

import { useState, Fragment } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Home,
  LogOut,
  Menu as MenuIcon,
  X,
  UserRound
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Menu, Transition, Dialog } from "@headlessui/react";
import toast from "react-hot-toast";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";

const nav = [
  { label: "Mis Proyectos", href: "/portal", icon: Home }
];

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const { data: userData } = useSWR<{ user: { name: string, email: string, role: string } }>('/api/auth/me', fetcher);
  const user = userData?.user;

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
        <p className="mt-3 max-w-[210px] text-sm leading-5 text-white/78">Portal de Seguimiento para Clientes</p>
      </div>
      <nav className="erfor-scroll flex-1 overflow-y-auto px-2 pb-6">
        {nav.map((item) => {
          const active = pathname === item.href || (item.href !== "/portal" && pathname.startsWith(`${item.href}/`));
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
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[292px] flex-col bg-erfor-ink text-white lg:flex">
        <SidebarContent />
      </aside>

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
                <MenuIcon className="h-6 w-6" aria-hidden="true" />
              </button>
              <div>
                <div className="mb-2 block lg:hidden">
                  <BrandLogo variant="dark" className="w-max" />
                </div>
                <h1 className="text-xl font-semibold hidden md:block">Bienvenido, <span className="text-erfor-green">{user?.name || "Cliente"}</span></h1>
                <p className="text-sm text-slate-500 hidden md:block">Portal de Seguimiento</p>
              </div>
            </div>
            
            <div className="flex flex-1 items-center justify-end gap-3">
              <Menu as="div" className="relative ml-3">
                <Menu.Button className="flex items-center gap-3 rounded-md px-2 py-1 hover:bg-slate-100 transition outline-none">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-erfor-mist text-erfor-green">
                    <UserRound className="h-5 w-5" />
                  </span>
                  <span className="hidden text-left text-sm md:block">
                    <span className="block font-semibold">{user?.name || "Cliente"}</span>
                    <span className="text-xs text-slate-500">Cliente Externo</span>
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
    </div>
  );
}
