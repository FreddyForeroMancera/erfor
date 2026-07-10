"use client";

import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, MapPin, Target, ShieldAlert, FileArchive, Building2, Droplets, Zap, Sprout, FileText, Download, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from "recharts";

const getImageForProperty = (name: string) => {
  if (name?.includes("Esperanza")) return "/predios/hacienda.png";
  if (name?.includes("Industrial")) return "/predios/industrial.png";
  if (name?.includes("Paraíso")) return "/predios/reserva.png";
  if (name?.includes("Porvenir")) return "/predios/porvenir.png";
  return "/predios/hacienda.png"; // Fallback general
};

const getSimulatedProcesses = (name: string) => {
  const isAgri = name?.includes("Esperanza") || name?.includes("Porvenir");
  const isInd = name?.includes("Industrial");
  
  if (isAgri) {
    return [
      { type: "Concesión de Aguas", entity: "CAR", status: "Aprobado", name: "Resolución 1234 - Uso agrícola", date: "15/03/2025", file: "res-1234.pdf" },
      { type: "Registro RESPEL", entity: "IDEAM", status: "En Trámite", name: "Actualización de generador de envases agroquímicos", date: "10/05/2026", file: "radicado-respel.pdf" },
      { type: "Plan de Manejo Ambiental", entity: "CAR", status: "Requiere Acción", name: "Seguimiento semestral de PMA", date: "01/06/2026", file: "informe-pma-v2.pdf" }
    ];
  }
  if (isInd) {
    return [
      { type: "Permiso de Vertimientos", entity: "SDA", status: "En Trámite", name: "Renovación vertimientos no domésticos", date: "20/04/2026", file: "caracterizacion-2026.pdf" },
      { type: "Emisiones Atmosféricas", entity: "SDA", status: "Aprobado", name: "Concepto técnico calderas", date: "12/01/2025", file: "isocineticos-caldera.pdf" },
      { type: "Registro RESPEL", entity: "IDEAM", status: "Aprobado", name: "Declaración anual de residuos peligrosos", date: "28/02/2026", file: "declaracion-anual.pdf" },
      { type: "Licencia Ambiental", entity: "ANLA", status: "Requiere Acción", name: "Requerimiento Auto No. 4567", date: "05/06/2026", file: "auto-4567.pdf" }
    ];
  }
  return [
    { type: "Ocupación de Cauce", entity: "Cortolima", status: "Aprobado", name: "Permiso puente peatonal", date: "10/11/2024", file: "res-098.pdf" },
    { type: "Aprovechamiento Forestal", entity: "Cortolima", status: "En Trámite", name: "Radicado tala árboles aislados", date: "02/06/2026", file: "rad-forestal.pdf" }
  ];
};

// Simulated data based on property name
const getSimulatedData = (name: string) => {
  const isAgri = name?.includes("Esperanza");
  const isInd = name?.includes("Industrial");
  
  return {
    complianceData: [
      { name: "Cumplido", value: isAgri ? 85 : isInd ? 60 : 95, color: "#10b981" },
      { name: "En Proceso", value: isAgri ? 10 : isInd ? 25 : 5, color: "#f59e0b" },
      { name: "Vencido", value: isAgri ? 5 : isInd ? 15 : 0, color: "#ef4444" },
    ],
    resourceUsage: [
      { month: "Ene", agua: isAgri ? 400 : 250, energia: isInd ? 600 : 200 },
      { month: "Feb", agua: isAgri ? 420 : 260, energia: isInd ? 580 : 210 },
      { month: "Mar", agua: isAgri ? 380 : 255, energia: isInd ? 620 : 205 },
      { month: "Abr", agua: isAgri ? 450 : 270, energia: isInd ? 650 : 220 },
      { month: "May", agua: isAgri ? 480 : 280, energia: isInd ? 610 : 215 },
      { month: "Jun", agua: isAgri ? 500 : 290, energia: isInd ? 640 : 230 },
    ]
  };
};

export function PropertyDetailModule({ propertyId }: { propertyId: string }) {
  const [property, setProperty] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/properties/${propertyId}`);
        const data = await res.json();
        setProperty(data.item || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [propertyId]);

  if (loading) {
    return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-erfor-green" /></div>;
  }

  if (!property) {
    return <div className="p-8 text-center"><h2 className="text-xl font-bold">Predio no encontrado</h2><Link href="/predios" className="text-erfor-green mt-4 block">Volver a predios</Link></div>;
  }

  const bgImage = getImageForProperty(property.name);
  const { complianceData, resourceUsage } = getSimulatedData(property.name);
  const processes = getSimulatedProcesses(property.name);

  const getStatusBadge = (status: string) => {
    if (status === "Aprobado") return <span className="flex items-center gap-1 text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded"><CheckCircle2 className="h-3 w-3"/> {status}</span>;
    if (status === "En Trámite") return <span className="flex items-center gap-1 text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded"><Clock className="h-3 w-3"/> {status}</span>;
    return <span className="flex items-center gap-1 text-xs font-bold bg-red-100 text-red-700 px-2 py-1 rounded"><AlertCircle className="h-3 w-3"/> {status}</span>;
  };

  return (
    <div className="pb-12">
      {/* Header / Hero */}
      <div className="relative h-64 md:h-80 w-full bg-slate-900">
        {bgImage ? (
          <img src={bgImage} alt={property.name} className="absolute inset-0 h-full w-full object-cover opacity-60" />
        ) : (
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
        
        <div className="absolute top-4 left-4 lg:left-8">
          <Link href="/predios" className="flex items-center gap-2 text-white/80 hover:text-white transition-colors bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-md text-sm font-medium">
            <ArrowLeft className="h-4 w-4" /> Volver a Predios
          </Link>
        </div>

        <div className="absolute bottom-6 left-4 right-4 lg:left-8 lg:right-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-erfor-green text-white text-xs font-bold px-2.5 py-1 rounded shadow-sm">{property.useCurrent || "Uso N/D"}</span>
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {property.city || "Sin municipio"}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-2 drop-shadow-lg">{property.name}</h1>
            <p className="text-white/80 text-sm md:text-base flex items-center gap-2">
              <Target className="h-4 w-4" /> Autoridad: {property.environmentalAuthority || "N/D"}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-white min-w-[200px]">
            <p className="text-xs text-white/70 uppercase font-semibold mb-1">Área Total</p>
            <p className="text-2xl font-bold">{property.area || "N/D"}</p>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 -mt-4 relative z-10">
        
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center text-sky-600">
              <FileArchive className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Expedientes Activos</p>
              <p className="text-2xl font-bold text-slate-800">{complianceData[0].value > 80 ? 3 : 7}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-erfor-green/20 flex items-center justify-center text-erfor-green">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Visitas de Campo</p>
              <p className="text-2xl font-bold text-slate-800">{complianceData[0].value > 80 ? 1 : 4}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Restricciones</p>
              <p className="text-2xl font-bold text-slate-800">{property.environmentalRestrictions ? "1" : "0"}</p>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Índice Sostenibilidad</p>
              <p className="text-2xl font-bold text-slate-800">{complianceData[0].value}%</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info Card */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Información del Predio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Cédula Catastral</p>
                <p className="text-sm text-slate-800">{property.cadastralCode || "No registrada"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Matrícula Inmobiliaria</p>
                <p className="text-sm text-slate-800">{property.realEstateRegistration || "No registrada"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Propietario</p>
                <p className="text-sm text-slate-800">{property.owner || "No registrado"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Dirección</p>
                <p className="text-sm text-slate-800">{property.address || "No registrada"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Coordenadas</p>
                {property.coordinates ? (
                  <div className="text-sm text-slate-800">
                    <p className="font-mono text-xs truncate" title={property.coordinates}>{property.coordinates}</p>
                    {(() => {
                      const first = property.coordinates.trim().split(/\s+/)[0];
                      const parts = first.split(",");
                      const lon = parseFloat(parts[0]);
                      const lat = parseFloat(parts[1]);
                      if (!isNaN(lon) && !isNaN(lat)) {
                        return (
                          <a
                            href={`https://www.google.com/maps?q=${lat},${lon}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-erfor-green hover:underline text-xs font-medium"
                          >
                            Ver en Google Maps
                          </a>
                        );
                      }
                      return null;
                    })()}
                  </div>
                ) : (
                  <p className="text-sm text-slate-800">No registradas</p>
                )}
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase font-bold mb-1">Uso Actual vs Propuesto</p>
                <p className="text-sm text-slate-800 flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">{property.useCurrent || "N/A"}</span>
                  <ArrowLeft className="h-3 w-3 rotate-180 text-slate-400" />
                  <span className="px-2 py-0.5 bg-erfor-green/10 rounded text-erfor-green font-medium">{property.useProposed || "N/A"}</span>
                </p>
              </div>
              <div className="md:col-span-2">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mt-2">
                  <h4 className="text-sm font-bold text-amber-800 flex items-center gap-2 mb-2">
                    <ShieldAlert className="h-4 w-4" /> Restricciones Ambientales
                  </h4>
                  <p className="text-sm text-amber-700">{property.environmentalRestrictions || "No se han detectado restricciones ambientales críticas para este predio."}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">Estado de Obligaciones</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={complianceData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {complianceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, 'Porcentaje']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Resources Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-2">
            <h3 className="text-lg font-bold text-slate-800">Monitoreo de Recursos (Consumo Mensual)</h3>
            <div className="flex gap-4 text-sm font-medium">
              <span className="flex items-center gap-1.5 text-blue-600"><Droplets className="h-4 w-4" /> Agua (m³)</span>
              <span className="flex items-center gap-1.5 text-amber-500"><Zap className="h-4 w-4" /> Energía (kWh)</span>
            </div>
          </div>
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={resourceUsage} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dy={10} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={-10} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} dx={10} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Line yAxisId="left" type="monotone" dataKey="agua" name="Consumo Agua (m³)" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                <Line yAxisId="right" type="monotone" dataKey="energia" name="Energía (kWh)" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Processes & Documents Table */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-2">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Trámites y Permisos Ambientales (Normativa Colombia)</h3>
              <p className="text-sm text-slate-500">Expedientes activos, reportes y requerimientos legales</p>
            </div>
            <button className="text-sm font-medium bg-erfor-green text-white px-4 py-2 rounded hover:bg-green-700 transition">
              Nuevo Trámite
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200 text-xs uppercase font-bold text-slate-500">
                  <th className="py-3 px-4">Tipo de Trámite</th>
                  <th className="py-3 px-4">Descripción / Radicado</th>
                  <th className="py-3 px-4">Entidad</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4">Última Actuación</th>
                  <th className="py-3 px-4 text-center">Documento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processes.map((proc, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800 text-sm">{proc.type}</td>
                    <td className="py-3 px-4 text-sm text-slate-600">{proc.name}</td>
                    <td className="py-3 px-4 text-sm font-medium text-slate-700">{proc.entity}</td>
                    <td className="py-3 px-4">{getStatusBadge(proc.status)}</td>
                    <td className="py-3 px-4 text-sm text-slate-500">{proc.date}</td>
                    <td className="py-3 px-4 text-center">
                      <button className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-100 text-slate-600 hover:bg-erfor-green hover:text-white transition" title={proc.file}>
                        <FileText className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}
