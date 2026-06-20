"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, FileCheck2, Loader2, ArrowRight } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import Link from "next/link";

interface TramitesModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId?: string | null;
}

export function TramitesModal({ isOpen, onClose, clientId }: TramitesModalProps) {
  const url = clientId ? `/api/expedientes?clientId=${clientId}` : "/api/expedientes";
  const { data, isLoading } = useSWR<any>(isOpen ? url : null, fetcher);

  const tramites = data?.items?.filter((f: any) => f.status === "TRACKING" || f.status === "IN_REVIEW" || f.status === "PREPARATION") || [];

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
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
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all">
                <div className="border-b border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between">
                  <Dialog.Title as="h3" className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <FileCheck2 className="h-5 w-5 text-sky-600" />
                    Procesos En Trámite
                  </Dialog.Title>
                  <button onClick={onClose} className="rounded-full p-1 hover:bg-slate-200 text-slate-500 transition">
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-sky-600" /></div>
                  ) : tramites.length === 0 ? (
                    <div className="p-8 text-center text-slate-500">
                      No hay expedientes en trámite actualmente.
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {tramites.map((file: any) => (
                        <Link key={file.id} href={`/expedientes/${file.id}`} onClick={onClose} className="group flex items-center justify-between rounded-lg border border-slate-100 p-4 transition-all hover:border-sky-200 hover:bg-sky-50/50">
                          <div>
                            <p className="font-semibold text-slate-800 group-hover:text-sky-700">{file.officialCode || file.internalCode}</p>
                            <p className="text-xs text-slate-500 mt-1">{file.client?.name} • {file.authority}</p>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                              En Trámite
                            </span>
                            <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-sky-600 transition-transform group-hover:translate-x-1" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
