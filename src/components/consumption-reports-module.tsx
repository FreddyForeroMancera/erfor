"use client";

import { useState } from "react";
import { Check, X, Calendar as CalendarIcon, FileBarChart, Play } from "lucide-react";
import { usePersistedToggle } from "@/hooks/use-persisted-toggle";

type ReportStatus = "CUMPLIDO" | "NO_CUMPLIDO" | "PENDIENTE";
type Periodicity = "MENSUAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

interface ReportItem {
  id: string;
  year: number;
  period: string;
  status: ReportStatus;
  date?: string;
  note?: string;
}

export function ConsumptionReportsModule({ fileId }: { fileId: string }) {
  const [isActive, handleToggleActive, setIsActive] = usePersistedToggle(`consumption-active-${fileId}`, false);
  const [isGenerated, setIsGenerated] = useState(false);
  const [periodicity, setPeriodicity] = useState<Periodicity>("MENSUAL");
  const [startYear, setStartYear] = useState(new Date().getFullYear().toString());
  const [resolution, setResolution] = useState("");
  
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const handleActivate = () => {
    setIsActive(true);
  };

  const generateReports = () => {
    if (!startYear || !resolution) return alert("Por favor ingresa un año de inicio y número de resolución.");
    
    const newReports: ReportItem[] = [];
    const start = parseInt(startYear);
    
    for (let y = 0; y < 10; y++) {
      const currentYear = start + y;
      let periods: string[] = [];
      if (periodicity === "MENSUAL") periods = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
      else if (periodicity === "TRIMESTRAL") periods = ["Trimestre 1", "Trimestre 2", "Trimestre 3", "Trimestre 4"];
      else if (periodicity === "SEMESTRAL") periods = ["Semestre 1", "Semestre 2"];
      else if (periodicity === "ANUAL") periods = ["Anual"];

      periods.forEach((p, idx) => {
        newReports.push({
          id: `${currentYear}-${idx}`,
          year: currentYear,
          period: p,
          status: "PENDIENTE",
          note: ""
        });
      });
    }
    
    setReports(newReports);
    setSelectedYear(start);
    setIsGenerated(true);
  };

  const resetGeneration = () => {
    if (confirm("¿Estás seguro que deseas reiniciar? Se perderá el avance de los reportes actuales.")) {
      setReports([]);
      setIsGenerated(false);
    }
  };

  const updateStatus = (id: string, status: ReportStatus) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const updateDate = (id: string, date: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, date, status: date ? "CUMPLIDO" : "PENDIENTE" } : r));
  };

  const updateNote = (id: string, note: string) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, note } : r));
  };

  const yearsAvailable = Array.from(new Set(reports.map(r => r.year))).sort();
  const visibleReports = reports.filter(r => r.year === selectedYear);

  return (
    <section className={`mt-4 rounded-lg border ${isActive ? "border-erfor-green/30 bg-white" : "border-slate-200 bg-slate-50/50"} p-5 shadow-sm transition-colors`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <FileBarChart className={`h-5 w-5 ${isActive ? "text-erfor-green" : "text-slate-400"}`} />
          <h3 className={`font-semibold ${isActive ? "text-slate-800" : "text-slate-500"}`}>Reporte de Consumos</h3>
        </div>
        
        <button
          onClick={handleToggleActive}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-erfor-green focus:ring-offset-2 ${
            isActive ? 'bg-erfor-green' : 'bg-slate-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isActive ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
      
      {!isActive ? (
        <div className="py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
          <FileBarChart className="h-8 w-8 text-slate-300 mb-2" />
          <p>El módulo de reporte de consumos se encuentra desactivado.</p>
          <button 
            onClick={handleActivate}
            className="mt-2 text-erfor-green hover:underline font-medium"
          >
            Activar módulo
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Configuración */}
          {!isGenerated ? (
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">Configuración de Reportes (10 Años)</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Periodicidad</label>
                  <select 
                    value={periodicity} 
                    onChange={(e) => setPeriodicity(e.target.value as Periodicity)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none bg-white"
                  >
                    <option value="MENSUAL">Mensual</option>
                    <option value="TRIMESTRAL">Trimestral</option>
                    <option value="SEMESTRAL">Semestral</option>
                    <option value="ANUAL">Anual</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Año de Inicio</label>
                  <input 
                    type="number" 
                    value={startYear}
                    onChange={(e) => setStartYear(e.target.value)}
                    placeholder="Ej. 2024"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Número de Resolución</label>
                  <input 
                    type="text" 
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Ej. RES-001"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none bg-white"
                  />
                </div>
              </div>
              <button 
                onClick={generateReports}
                className="bg-erfor-green text-white px-4 py-2 rounded-md font-semibold text-sm hover:bg-green-700 transition flex items-center gap-2"
              >
                <Play className="h-4 w-4" /> Generar Reportes
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-4">
                  <div className="bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 text-sm">
                    <span className="font-semibold text-slate-500">Resolución:</span> <span className="font-bold text-slate-800">{resolution}</span>
                  </div>
                  <div className="bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200 text-sm">
                    <span className="font-semibold text-slate-500">Frecuencia:</span> <span className="font-bold text-slate-800">{periodicity}</span>
                  </div>
                </div>
                <button 
                  onClick={resetGeneration}
                  className="text-xs font-medium text-red-500 hover:underline"
                >
                  Reiniciar Configuración
                </button>
              </div>

              {/* TABS DE AÑOS */}
              <div className="flex flex-wrap gap-2 mb-4 border-b border-slate-200 pb-3">
                {yearsAvailable.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                      selectedYear === year 
                        ? "bg-slate-800 text-white" 
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    Año {year}
                  </button>
                ))}
              </div>

              {/* GRID DE REPORTES DEL AÑO SELECCIONADO */}
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {visibleReports.map((rep) => (
                  <div key={rep.id} className="flex flex-col justify-between rounded-md border border-slate-200 p-4 transition hover:border-erfor-green/50 bg-white shadow-sm">
                    <span className="font-semibold text-slate-800 mb-3">{rep.period} {rep.year}</span>
                    
                    <div className="flex flex-col gap-3 mt-auto">
                      <input 
                        type="text" 
                        placeholder="Ingresar detalle u observación..." 
                        value={rep.note || ""}
                        onChange={(e) => updateNote(rep.id, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none text-slate-700 bg-slate-50"
                      />
                      
                      <div className="flex gap-2 mt-2">
                        <div className="flex-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fecha de presentación</span>
                          <div className="relative">
                            <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input 
                              type="date" 
                              value={rep.date || ""}
                              onChange={(e) => updateDate(rep.id, e.target.value)}
                              className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => updateStatus(rep.id, "CUMPLIDO")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                            rep.status === "CUMPLIDO" 
                              ? "bg-erfor-green text-white border-erfor-green" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <Check className="h-3.5 w-3.5" /> Cumplido
                        </button>
                        <button
                          onClick={() => updateStatus(rep.id, "NO_CUMPLIDO")}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                            rep.status === "NO_CUMPLIDO" 
                              ? "bg-red-500 text-white border-red-500" 
                              : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                          }`}
                        >
                          <X className="h-3.5 w-3.5" /> No Cumplido
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
