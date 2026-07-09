"use client";

import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

/**
 * Recorre todos los expedientes que aún no tienen predio asociado y les corre el
 * re-análisis con IA (POST /api/expedientes/:id/reanalyze), uno por uno desde el cliente
 * para no exceder el límite de tiempo de la función serverless. Sirve para llenar de un
 * solo golpe todo lo que la carga masiva no logró detectar automáticamente.
 */
export function ReanalyzeAllModule() {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const [summary, setSummary] = useState<{ filled: number; total: number } | null>(null);

  const run = async () => {
    setRunning(true);
    setSummary(null);
    setProgress("Buscando expedientes sin predio...");
    try {
      const res = await fetch("/api/expedientes");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudieron cargar los expedientes");

      const pending = (data.items || []).filter((e: any) => !e.property && !e.propertyId);
      if (pending.length === 0) {
        toast.success("Todos los expedientes ya tienen predio asignado.");
        setSummary({ filled: 0, total: 0 });
        return;
      }

      let filled = 0;
      for (let i = 0; i < pending.length; i++) {
        const exp = pending[i];
        setProgress(`Analizando ${i + 1} de ${pending.length}: ${exp.internalCode}...`);
        try {
          const r = await fetch(`/api/expedientes/${exp.id}/reanalyze`, { method: "POST" });
          const d = await r.json().catch(() => ({}));
          if (r.ok && d.property) filled++;
        } catch {
          // Un fallo puntual no debe detener el lote.
        }
      }

      setSummary({ filled, total: pending.length });
      toast.success(`Re-análisis terminado: ${filled} de ${pending.length} expedientes con predio detectado.`, { duration: 8000 });
    } catch (err: any) {
      toast.error(err?.message || "Error al re-analizar", { duration: 8000 });
    } finally {
      setRunning(false);
      setProgress("");
    }
  };

  return (
    <div className="max-w-5xl mx-auto mt-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="h-11 w-11 rounded-xl bg-erfor-mist flex items-center justify-center text-erfor-green shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Re-analizar expedientes pendientes</h3>
            <p className="text-sm text-slate-500 mt-0.5 max-w-xl">
              Corre la IA sobre los documentos ya subidos de todos los expedientes que aún no tienen predio,
              para detectar predio, propietario y representante sin volver a subir archivos.
            </p>
            {summary && (
              <p className="text-sm font-semibold text-erfor-green mt-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                {summary.total === 0
                  ? "No había expedientes pendientes."
                  : `${summary.filled} de ${summary.total} expedientes con predio detectado.`}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={run}
          disabled={running}
          className="shrink-0 flex items-center justify-center gap-2 bg-erfor-green text-white px-5 py-2.5 rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-60"
        >
          {running ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
          {running ? (progress || "Analizando...") : "Re-analizar todo"}
        </button>
      </div>
    </div>
  );
}
