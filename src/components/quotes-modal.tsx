"use client";

import { Fragment, useState, useEffect, useRef } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X, UploadCloud, FileText, Loader2, Download, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useClient } from "@/lib/client-context";

type QuoteDocument = {
  id: string;
  name: string;
  fileUrl: string;
  createdAt: string;
};

export function QuotesModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { selectedClientId } = useClient();
  const [quotes, setQuotes] = useState<QuoteDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      loadQuotes();
    }
  }, [isOpen, selectedClientId]);

  async function loadQuotes() {
    setLoading(true);
    try {
      const url = selectedClientId ? `/api/quotes?clientId=${selectedClientId}` : "/api/quotes";
      const res = await fetch(url);
      if (!res.ok) throw new Error("Error cargando cotizaciones");
      const data = await res.json();
      setQuotes(data);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Solo se permiten archivos PDF");
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    if (selectedClientId) {
      formData.append("clientId", selectedClientId);
    }

    try {
      const res = await fetch("/api/quotes", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Error al subir la cotización");
      }

      toast.success("Cotización subida exitosamente");
      loadQuotes();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-5">
                  <Dialog.Title as="h3" className="text-xl font-bold leading-6 text-slate-900 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-erfor-green" />
                    Cotizaciones y Presupuestos
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Upload Area */}
                <div 
                  className="mb-6 border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:bg-slate-50 transition cursor-pointer flex flex-col items-center justify-center"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept=".pdf" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  {uploading ? (
                    <div className="flex flex-col items-center text-slate-500">
                      <Loader2 className="h-10 w-10 animate-spin mb-3 text-erfor-green" />
                      <p className="text-sm font-medium">Subiendo archivo...</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-12 w-12 rounded-full bg-erfor-green/10 flex items-center justify-center mb-3">
                        <UploadCloud className="h-6 w-6 text-erfor-green" />
                      </div>
                      <p className="text-sm font-medium text-slate-700">Haz clic para subir una cotización en PDF</p>
                      <p className="text-xs text-slate-500 mt-1">Soporta solo archivos PDF</p>
                    </>
                  )}
                </div>

                {/* List of Quotes */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-800 mb-3">Cotizaciones Recientes</h4>
                  {loading ? (
                    <div className="flex justify-center p-8 text-slate-500">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : quotes.length === 0 ? (
                    <div className="text-center p-8 bg-slate-50 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-500">No hay cotizaciones registradas todavía.</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {quotes.map((q) => (
                        <div key={q.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-erfor-green/50 transition group">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 text-red-600 rounded-md">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800 truncate max-w-[300px]" title={q.name}>{q.name}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(q.createdAt).toLocaleDateString("es-CO", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a 
                              href={q.fileUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="p-1.5 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-md transition"
                              title="Descargar"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
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
