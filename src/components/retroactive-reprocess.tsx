"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, FileText, Play, Database, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

type PendingDoc = {
  id: string;
  name: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
  environmentalFileId: string | null;
};

export function RetroactiveReprocess() {
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pendingDocs, setPendingDocs] = useState<PendingDoc[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [currentFile, setCurrentFile] = useState("");
  const [results, setResults] = useState<{ success: number; failed: number; propertiesFound: number }>({
    success: 0,
    failed: 0,
    propertiesFound: 0
  });
  const [hasScanned, setHasScanned] = useState(false);

  // Buscar documentos candidatos
  const scanDocuments = async () => {
    setScanning(true);
    setHasScanned(true);
    try {
      const res = await fetch("/api/documents?pendingReprocess=true");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al escanear documentos");
      
      setPendingDocs(data.items || []);
      toast.success(`Escaneo completado. Se encontraron ${data.total} documentos pendientes.`);
    } catch (err: any) {
      toast.error(err?.message || "Error al buscar documentos");
    } finally {
      setScanning(false);
    }
  };

  // Procesar documentos secuencialmente (uno por uno) para evitar timeouts en Vercel
  const startReprocessing = async () => {
    if (pendingDocs.length === 0) return;
    
    setProcessing(true);
    setProgress({ current: 0, total: pendingDocs.length });
    setResults({ success: 0, failed: 0, propertiesFound: 0 });

    let successCount = 0;
    let failedCount = 0;
    let propertiesCount = 0;

    for (let i = 0; i < pendingDocs.length; i++) {
      const doc = pendingDocs[i];
      setCurrentFile(doc.name);
      setProgress((prev) => ({ ...prev, current: i + 1 }));

      try {
        const res = await fetch(`/api/documents/${doc.id}/reprocess`, {
          method: "POST"
        });
        const data = await res.json();

        if (res.ok && data.success) {
          successCount++;
          if (data.propertyExtraction?.success) {
            propertiesCount++;
          }
        } else {
          failedCount++;
          console.error(`Error procesando ${doc.name}:`, data.error);
        }
      } catch (err) {
        failedCount++;
        console.error(`Error procesando ${doc.name}:`, err);
      }

      setResults({
        success: successCount,
        failed: failedCount,
        propertiesFound: propertiesCount
      });
    }

    setProcessing(false);
    setCurrentFile("");
    setPendingDocs([]); // Limpiar tras terminar
    toast.success(`Procesamiento finalizado. Exitosos: ${successCount}, Fallidos: ${failedCount}.`, {
      duration: 6000
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
        <div className="flex gap-4 items-start">
          <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Database className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Reprocesamiento Retroactivo de Documentos</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xl">
              Descarga archivos históricos desde Supabase, extrae el texto completo mediante OCR (Tesseract WASM) 
              y ejecuta la extracción de predios con IA. Evita timeouts de Vercel al procesar uno a uno.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={scanDocuments}
            disabled={scanning || processing}
            className="flex items-center gap-2 border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium hover:bg-slate-50 transition disabled:opacity-50"
          >
            {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Buscar Pendientes
          </button>
          
          {pendingDocs.length > 0 && (
            <button
              onClick={startReprocessing}
              disabled={processing}
              className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
            >
              {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
              Procesar {pendingDocs.length} Archivos
            </button>
          )}
        </div>
      </div>

      {/* Indicadores de procesamiento activo */}
      {processing && (
        <div className="bg-slate-50 border border-slate-150 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Procesando cola de documentos</span>
            <span className="text-sm font-bold text-slate-900">
              {progress.current} / {progress.total} ({Math.round((progress.current / progress.total) * 100)}%)
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden mb-4">
            <div 
              className="bg-emerald-600 h-full transition-all duration-300 rounded-full" 
              style={{ width: `${(progress.current / progress.total) * 100}%` }}
            />
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-700">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-600 shrink-0" />
            <span className="truncate font-medium">Ejecutando OCR e IA sobre: <span className="font-semibold text-slate-900">{currentFile}</span></span>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 text-center">
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-2xl font-bold text-emerald-600">{results.success}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Exitosos</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-2xl font-bold text-rose-600">{results.failed}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Fallidos</div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-slate-200">
              <div className="text-2xl font-bold text-indigo-600">{results.propertiesFound}</div>
              <div className="text-xs text-slate-500 font-medium mt-1">Predios Creados</div>
            </div>
          </div>
        </div>
      )}

      {/* Lista de archivos pendientes */}
      {pendingDocs.length > 0 && !processing && (
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Archivos detectados sin texto indexado ({pendingDocs.length})
          </div>
          <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100">
            {pendingDocs.map((doc) => (
              <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="h-5 w-5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Subido el {new Date(doc.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-xs font-medium text-slate-500 text-right shrink-0">
                  {formatSize(doc.fileSize)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pantalla vacía o finalizado */}
      {pendingDocs.length === 0 && !processing && hasScanned && (
        <div className="flex flex-col items-center justify-center text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h4 className="font-semibold text-slate-900">Base de datos optimizada</h4>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            No se encontraron documentos sin procesar. Todos tus documentos en Supabase ya cuentan con su texto indexado e información estructurada.
          </p>
        </div>
      )}

      {/* Pantalla inicial de invitación al escaneo */}
      {!hasScanned && !processing && (
        <div className="flex flex-col items-center justify-center text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50">
          <div className="h-12 w-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center mb-3">
            <Database className="h-6 w-6" />
          </div>
          <h4 className="font-semibold text-slate-900">Iniciar escaneo del sistema</h4>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            Presiona el botón "Buscar Pendientes" arriba para escanear tu base de datos en busca de documentos históricos que requieran reprocesarse con el nuevo motor de OCR e IA.
          </p>
        </div>
      )}
    </div>
  );
}
