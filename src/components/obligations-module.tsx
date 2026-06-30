"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Check, X, Calendar as CalendarIcon, ClipboardCheck, AlertTriangle } from "lucide-react";
import { usePersistedToggle } from "@/hooks/use-persisted-toggle";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";

type ObligationStatus = "CUMPLIDO" | "NO_CUMPLIDO" | "PENDIENTE";

interface ObligationItem {
  id: string;
  title: string;
  category: string;
  status: ObligationStatus;
  dueDate?: string;
  resolutionNumber?: string;
  comments?: string;
}

export function ObligationsModule({ fileId }: { fileId: string }) {
  const [isActive, handleToggleActive, setIsActive] = usePersistedToggle(`obligations-active-${fileId}`, false);
  const [loading, setLoading] = useState(false);

  const handleActivate = () => setIsActive(true);

  // States for Security Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{id: string, status: ObligationStatus} | null>(null);
  const [confirmationChecked, setConfirmationChecked] = useState(false);

  // Data States
  const [obligations, setObligations] = useState<ObligationItem[]>([]);
  
  const [demands, setDemands] = useState([
    { id: '1', uso: 'Pecuario', ltsSeg: '0,03', m3Dia: '2,6', m3Mes: '78' },
    { id: '2', uso: 'Riego', ltsSeg: '0,9', m3Dia: '77,8', m3Mes: '2.334' },
    { id: '3', uso: 'Uso doméstico', ltsSeg: '', m3Dia: '', m3Mes: '' },
    { id: '4', uso: '', ltsSeg: '', m3Dia: '', m3Mes: '' }
  ]);

  const [costos, setCostos] = useState([
    { id: '1', concepto: '', unidad: '', cantidad: '', vlrUnitario: '', vlrTotal: '' },
    { id: '2', concepto: '', unidad: '', cantidad: '', vlrUnitario: '', vlrTotal: '' }
  ]);

  const [obras, setObras] = useState([
    { id: '1', tipo: '', ubicacion: '', estado: '', observaciones: '' },
    { id: '2', tipo: '', ubicacion: '', estado: '', observaciones: '' }
  ]);

  const [consumos, setConsumos] = useState([
    { id: '1', mesAno: '', lecturaInicial: '', lecturaFinal: '', consumoM3: '' },
    { id: '2', mesAno: '', lecturaInicial: '', lecturaFinal: '', consumoM3: '' }
  ]);

  const loadData = useCallback(async () => {
    if (!isActive) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/obligations?fileId=${fileId}`);
      if (res.ok) setObligations(await res.json());

      const resDemands = await fetch(`/api/obligations/demands?fileId=${fileId}`);
      if (resDemands.ok) {
        const d = await resDemands.json();
        if (d && d.length > 0) setDemands(d);
      }

      // Load extra tables
      const loadTable = async (category: string, setter: any) => {
        const r = await fetch(`/api/obligations/extra-tables?fileId=${fileId}&category=${category}`);
        if (r.ok) {
          const data = await r.json();
          if (data && data.length > 0) setter(data);
        }
      };

      await Promise.all([
        loadTable('CUADRO_COSTOS', setCostos),
        loadTable('OBRAS_CAPTACION', setObras),
        loadTable('REPORTE_CONSUMOS', setConsumos)
      ]);

    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [fileId, isActive]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveObligation = async (id: string, field: string, value: any) => {
    try {
      const obs = obligations.find(o => o.id === id);
      if (!obs) return;
      const payload: any = { id, [field]: value };
      if (field === 'date') payload.status = value ? "CUMPLIDO" : "PENDIENTE";

      const res = await fetch(`/api/obligations`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        setObligations(prev => prev.map(o => o.id === id ? updated : o));
      }
    } catch (e) { console.error(e); }
  };

  const handleStatusChangeRequest = (id: string, status: ObligationStatus) => {
    const obs = obligations.find(o => o.id === id);
    if (!obs) return;

    // Trigger security modal only if going from NO_CUMPLIDO to CUMPLIDO (or viceversa if needed, let's trigger for any major switch)
    if (obs.status !== status) {
      setPendingStatusChange({ id, status });
      setConfirmationChecked(false);
      setIsConfirmModalOpen(true);
    }
  };

  const confirmStatusChange = () => {
    if (!pendingStatusChange) return;
    const { id, status } = pendingStatusChange;
    setObligations(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    saveObligation(id, 'status', status);
    toast.success("Estado actualizado con seguridad");
    setIsConfirmModalOpen(false);
    setPendingStatusChange(null);
  };

  const updateDate = (id: string, date: string) => {
    const status = date ? "CUMPLIDO" : "PENDIENTE";
    setObligations(prev => prev.map(o => o.id === id ? { ...o, dueDate: date ? new Date(date).toISOString() : undefined, status } : o));
    saveObligation(id, 'date', date);
  };

  const updateNote = (id: string, note: string) => {
    setObligations(prev => prev.map(o => o.id === id ? { ...o, comments: note } : o));
    saveObligation(id, 'note', note);
  };

  const updateResolution = (id: string, resolution: string) => {
    setObligations(prev => prev.map(o => o.id === id ? { ...o, resolutionNumber: resolution } : o));
    saveObligation(id, 'resolution', resolution);
  };

  // Generic Save for Tables
  const saveTable = async (category: string, rows: any[]) => {
    try {
      await fetch(`/api/obligations/extra-tables`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId, category, rows })
      });
    } catch (e) { console.error(e); }
  };

  const updateDemand = (id: string, field: string, value: string) => {
    const newArr = demands.map(d => d.id === id ? { ...d, [field]: value } : d);
    setDemands(newArr);
    fetch(`/api/obligations/demands`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, demands: newArr })
    }).catch(console.error);
  };

  const updateCosto = (id: string, field: string, value: string) => {
    const newArr = costos.map(d => d.id === id ? { ...d, [field]: value } : d);
    // Auto calculate VlrTotal if Cantidad and VlrUnitario are numbers
    const updatedWithTotal = newArr.map(d => {
      if (d.id === id && (field === 'cantidad' || field === 'vlrUnitario')) {
        const cant = parseFloat(d.cantidad.replace(/,/g, '.')) || 0;
        const vlr = parseFloat(d.vlrUnitario.replace(/,/g, '.')) || 0;
        if (cant > 0 && vlr > 0) {
          d.vlrTotal = (cant * vlr).toString();
        }
      }
      return d;
    });
    setCostos(updatedWithTotal);
    saveTable('CUADRO_COSTOS', updatedWithTotal);
  };

  const updateObra = (id: string, field: string, value: string) => {
    const newArr = obras.map(d => d.id === id ? { ...d, [field]: value } : d);
    setObras(newArr);
    saveTable('OBRAS_CAPTACION', newArr);
  };

  const updateConsumo = (id: string, field: string, value: string) => {
    const newArr = consumos.map(d => d.id === id ? { ...d, [field]: value } : d);
    setConsumos(newArr);
    saveTable('REPORTE_CONSUMOS', newArr);
  };

  // Helpers
  const parseNum = (val: string) => {
    if (!val) return 0;
    const clean = val.replace(/\./g, '').replace(/,/g, '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  };

  const formatNum = (num: number) => {
    if (num === 0) return "0";
    return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 }).format(num);
  };

  const totalDemand = {
    ltsSeg: formatNum(demands.reduce((sum, d) => sum + parseNum(d.ltsSeg), 0)),
    m3Dia: formatNum(demands.reduce((sum, d) => sum + parseNum(d.m3Dia), 0)),
    m3Mes: formatNum(demands.reduce((sum, d) => sum + parseNum(d.m3Mes), 0))
  };

  const totalCostos = formatNum(costos.reduce((sum, d) => sum + parseNum(d.vlrTotal), 0));

  return (
    <section className={`mt-4 rounded-lg border ${isActive ? "border-erfor-green/30 bg-white" : "border-slate-200 bg-slate-50/50"} p-5 shadow-sm transition-colors`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className={`h-5 w-5 ${isActive ? "text-erfor-green" : "text-slate-400"}`} />
          <h3 className={`font-semibold ${isActive ? "text-slate-800" : "text-slate-500"}`}>Módulo de OBLIGACIONES</h3>
        </div>
        
        <button
          onClick={handleToggleActive}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-erfor-green focus:ring-offset-2 ${
            isActive ? 'bg-erfor-green' : 'bg-slate-300'
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
      
      {!isActive ? (
        <div className="py-8 text-center text-sm text-slate-500 flex flex-col items-center gap-2">
          <ClipboardCheck className="h-8 w-8 text-slate-300 mb-2" />
          <p>El módulo de obligaciones se encuentra desactivado.</p>
          <button onClick={handleActivate} className="mt-2 text-erfor-green hover:underline font-medium">Activar módulo</button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tarjetas de Obligaciones */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {obligations.map((obs) => (
              <div key={obs.id} className="flex flex-col justify-between rounded-md border border-slate-200 p-4 transition hover:border-erfor-green/50 bg-white shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-bold text-slate-800 text-sm">{obs.category}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    obs.status === "CUMPLIDO" ? "bg-green-100 text-green-700" :
                    obs.status === "NO_CUMPLIDO" ? "bg-red-100 text-red-700" :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {obs.status}
                  </span>
                </div>
                
                <div className="flex flex-col gap-3 mt-auto">
                  <input 
                    type="text" 
                    placeholder="Ingresar detalle u observación..." 
                    value={obs.comments || ""}
                    onChange={(e) => updateNote(obs.id, e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none text-slate-700 bg-slate-50"
                  />
                  
                  <div className="flex gap-2 mt-2">
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Fecha de inicio</span>
                      <div className="relative">
                        <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input 
                          type="date" 
                          value={obs.dueDate ? new Date(obs.dueDate).toISOString().slice(0, 10) : ""}
                          onChange={(e) => updateDate(obs.id, e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none bg-white"
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Núm. de Resolución</span>
                      <input 
                        type="text" 
                        placeholder="Ej. RES-001"
                        value={obs.resolutionNumber || ""}
                        onChange={(e) => updateResolution(obs.id, e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-md focus:border-erfor-green focus:outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleStatusChangeRequest(obs.id, "CUMPLIDO")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                        obs.status === "CUMPLIDO" 
                          ? "bg-erfor-green text-white border-erfor-green" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" /> Cumplido
                    </button>
                    <button
                      onClick={() => handleStatusChangeRequest(obs.id, "NO_CUMPLIDO")}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                        obs.status === "NO_CUMPLIDO" 
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
        
          {/* 1. Tabla de Demanda Hídrica */}
          <div className="border border-slate-300 rounded-md overflow-hidden shadow-sm">
            <table className="w-full text-sm text-center border-collapse bg-white">
              <thead className="bg-slate-50 text-slate-800">
                <tr>
                  <th rowSpan={2} className="border border-slate-300 p-2 font-bold w-1/4 align-middle text-sm">Demanda Hídrica (Uso)</th>
                  <th colSpan={3} className="border border-slate-300 p-2 font-bold uppercase tracking-wider text-sm">CAUDAL</th>
                </tr>
                <tr>
                  <th className="border border-slate-300 p-2 font-bold text-xs bg-slate-100">Lts/Seg</th>
                  <th className="border border-slate-300 p-2 font-bold text-xs bg-slate-100">m³ /día</th>
                  <th className="border border-slate-300 p-2 font-bold text-xs bg-slate-100">m³ /mes</th>
                </tr>
              </thead>
              <tbody>
                {demands.map((d, i) => (
                  <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                    <td className="border border-slate-300 p-0 font-medium text-slate-700">
                      <input type="text" value={d.uso} onChange={(e) => updateDemand(d.id, 'uso', e.target.value)} className="w-full h-full p-2 text-center bg-transparent focus:outline-none" />
                    </td>
                    <td className="border border-slate-300 p-0 text-slate-700">
                      <input type="text" value={d.ltsSeg} onChange={(e) => updateDemand(d.id, 'ltsSeg', e.target.value)} className="w-full h-full p-2 text-center bg-transparent focus:outline-none" />
                    </td>
                    <td className="border border-slate-300 p-0 text-slate-700">
                      <input type="text" value={d.m3Dia} onChange={(e) => updateDemand(d.id, 'm3Dia', e.target.value)} className="w-full h-full p-2 text-center bg-transparent focus:outline-none" />
                    </td>
                    <td className="border border-slate-300 p-0 text-slate-700">
                      <input type="text" value={d.m3Mes} onChange={(e) => updateDemand(d.id, 'm3Mes', e.target.value)} className="w-full h-full p-2 text-center bg-transparent focus:outline-none" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100 text-slate-800 font-bold">
                  <td className="border border-slate-300 p-2 uppercase text-sm">TOTAL</td>
                  <td className="border border-slate-300 p-2">{totalDemand.ltsSeg}</td>
                  <td className="border border-slate-300 p-2">{totalDemand.m3Dia}</td>
                  <td className="border border-slate-300 p-2">{totalDemand.m3Mes}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* Modal de Seguridad (Doble Aprobación) */}
      <Transition appear show={isConfirmModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsConfirmModalOpen(false)}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4 text-amber-600">
                    <AlertTriangle className="h-6 w-6" />
                    <Dialog.Title as="h3" className="text-lg font-bold">Doble Aprobación Requerida</Dialog.Title>
                  </div>
                  <p className="text-sm text-slate-600 mb-6">
                    Estás a punto de cambiar el estado de esta obligación a <strong className="uppercase">{pendingStatusChange?.status}</strong>. Este cambio afectará los indicadores de cumplimiento del expediente.
                  </p>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-6">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1 h-4 w-4 rounded border-slate-300 text-erfor-green focus:ring-erfor-green" checked={confirmationChecked} onChange={(e) => setConfirmationChecked(e.target.checked)} />
                      <span className="text-sm font-medium text-slate-700">Entiendo las implicaciones y confirmo que deseo realizar este cambio de estado en la obligación.</span>
                    </label>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 transition" onClick={() => setIsConfirmModalOpen(false)}>Cancelar</button>
                    <button type="button" disabled={!confirmationChecked} className="rounded-lg bg-erfor-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed" onClick={confirmStatusChange}>Confirmar Cambio</button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

    </section>
  );
}
