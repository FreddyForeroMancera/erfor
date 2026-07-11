"use client";

import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  title?: string;
  isDeleting?: boolean;
  requireDoubleConfirmation?: boolean;
  doubleConfirmationLabel?: string;
}

export function DeleteConfirmationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  itemName = "este elemento", 
  title = "Confirmar Eliminación",
  isDeleting = false,
  requireDoubleConfirmation = false,
  doubleConfirmationLabel = "Entiendo que esta acción es permanente y no se podrá deshacer."
}: DeleteConfirmationModalProps) {
  const [confirmed, setConfirmed] = useState(false);

  // Reset confirmation state when modal opens
  useEffect(() => {
    if (isOpen) {
      setConfirmed(false);
    }
  }, [isOpen]);

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={() => !isDeleting && onClose()}>
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
              <Dialog.Panel className="w-full max-w-sm transform overflow-hidden rounded-2xl bg-white text-left align-middle shadow-xl transition-all border border-red-100">
                <div className="px-6 py-6 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 mb-4 border-4 border-red-50">
                    <AlertTriangle className="h-7 w-7 text-red-600" />
                  </div>
                  <Dialog.Title as="h3" className="text-lg font-bold text-slate-800">
                    {title}
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-slate-500">
                      ¿Estás seguro de que deseas eliminar <span className="font-semibold text-slate-700">{itemName}</span>?
                      Esta acción no se puede deshacer.
                    </p>
                  </div>

                  {requireDoubleConfirmation && (
                    <div className="mt-4 bg-red-50/50 border border-red-100 rounded-lg p-3 text-left">
                      <label className="flex items-start gap-2.5 cursor-pointer select-none">
                        <input 
                          type="checkbox" 
                          className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500 cursor-pointer"
                          checked={confirmed}
                          onChange={(e) => setConfirmed(e.target.checked)}
                        />
                        <span className="text-xs font-semibold text-slate-700 leading-tight">
                          {doubleConfirmationLabel}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
                
                <div className="bg-slate-50 px-6 py-4 flex items-center justify-center gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    disabled={isDeleting}
                    className="inline-flex justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none disabled:opacity-50 transition"
                    onClick={onClose}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting || (requireDoubleConfirmation && !confirmed)}
                    className="inline-flex items-center justify-center gap-2 rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition"
                    onClick={onConfirm}
                  >
                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isDeleting ? "Eliminando..." : "Sí, eliminar"}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
