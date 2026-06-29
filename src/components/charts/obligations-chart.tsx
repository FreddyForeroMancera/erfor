"use client";

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function ObligationsChart({ data }: { data: { category: string; _count: number }[] }) {
  if (!data || data.length === 0) {
    return <div className="flex h-full items-center justify-center text-slate-500">Sin datos suficientes</div>;
  }

  const chartData = data
    .map(item => ({
      name: item.category || "Sin Categoría",
      cantidad: item._count
    }))
    .sort((a, b) => b.cantidad - a.cantidad);

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
      >
        <defs>
          <linearGradient id="colorObligation" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
        <XAxis 
          dataKey="name" 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 12 }}
          angle={-15}
          textAnchor="end"
        />
        <YAxis 
          axisLine={false} 
          tickLine={false} 
          tick={{ fill: '#64748b', fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          formatter={(value: number) => [`${value} Obligaciones`, 'Total']}
        />
        <Area 
          type="monotone" 
          dataKey="cantidad" 
          stroke="#10b981" 
          fillOpacity={1} 
          fill="url(#colorObligation)" 
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
