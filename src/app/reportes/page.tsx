"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { Loader2, PieChart as PieChartIcon } from "lucide-react";
import toast from "react-hot-toast";
import { useClient } from "@/lib/client-context";
import { ProceduresChart } from "@/components/charts/procedures-chart";
import { ObligationsChart } from "@/components/charts/obligations-chart";
import { FilesAuthorityChart } from "@/components/charts/files-authority-chart";

type DashboardData = {
  charts: {
    obligationsByCategory: { category: string; _count: number }[];
    proceduresByStatus: { status: string; _count: number }[];
    filesByAuthority: { authority: string; _count: number }[];
  };
};

export default function ReportesPage() {
  const { selectedClientId } = useClient();
  const url = selectedClientId ? `/api/dashboard?clientId=${selectedClientId}` : "/api/dashboard";
  
  const { data, error, isLoading } = useSWR<DashboardData>(url, fetcher, {
    onError: (err) => toast.error("Error al cargar datos de reportes: " + err.message)
  });

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-md bg-red-50 p-4 border border-red-200">
          <p className="text-sm text-red-700">Hubo un error al cargar los reportes: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-4 lg:p-6 xl:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <PieChartIcon className="h-6 w-6 text-erfor-green" />
            Reportes Analíticos
          </h1>
          <p className="text-slate-500 mt-1">Métricas y estadísticas del sistema</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="animate-spin h-8 w-8 text-erfor-green" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Trámites por Estado</h2>
            <div className="h-80">
              <ProceduresChart data={data?.charts.proceduresByStatus || []} />
            </div>
          </div>
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Expedientes por Autoridad</h2>
            <div className="h-80">
              <FilesAuthorityChart data={data?.charts.filesByAuthority || []} />
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Obligaciones por Categoría</h2>
            <div className="h-96">
              <ObligationsChart data={data?.charts.obligationsByCategory || []} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
