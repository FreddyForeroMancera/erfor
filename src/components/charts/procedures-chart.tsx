"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = {
  PREPARATION: "#94a3b8",
  DRAFT: "#cbd5e1",
  FILED: "#0ea5e9",
  IN_REVIEW: "#f59e0b",
  REQUIREMENT: "#ef4444",
  RESPONDED: "#3b82f6",
  EVALUATION: "#8b5cf6",
  VISIT: "#ec4899",
  TECHNICAL_CONCEPT: "#14b8a6",
  APPROVED: "#10b981",
  REJECTED: "#dc2626",
  ARCHIVED: "#64748b"
};

const LABELS: Record<string, string> = {
  PREPARATION: "Preparación",
  DRAFT: "Borrador",
  FILED: "Radicado",
  IN_REVIEW: "En Revisión",
  REQUIREMENT: "Requerimiento",
  RESPONDED: "Respondido",
  EVALUATION: "Evaluación",
  VISIT: "Visita",
  TECHNICAL_CONCEPT: "Concepto Técnico",
  APPROVED: "Otorgado/Aprobado",
  REJECTED: "Rechazado",
  ARCHIVED: "Archivado"
};

export function ProceduresChart({ data }: { data: { status: string; _count: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="flex h-full items-center justify-center text-slate-500">Sin datos suficientes</div>;
  }

  const chartData = data.map(item => ({
    name: LABELS[item.status] || item.status,
    value: item._count,
    color: COLORS[item.status as keyof typeof COLORS] || "#slate-300"
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => [`${value} Trámites`, 'Cantidad']}
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
        />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  );
}
