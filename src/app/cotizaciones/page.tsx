"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { QuotesProceduresKanban } from "@/components/quotes-procedures-kanban";
import { Loader2 } from "lucide-react";

export default function CotizacionesYTramitesPage() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/cotizaciones");
      if (res.ok) {
        const json = await res.json();
        setData(json.items || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <AppShell>
      {loading ? (
        <div className="flex h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-erfor-green mb-4" />
            <p className="text-sm font-medium text-slate-500">Cargando cotizaciones y trámites...</p>
          </div>
        </div>
      ) : (
        <QuotesProceduresKanban initialData={data} onRefresh={loadData} />
      )}
    </AppShell>
  );
}
