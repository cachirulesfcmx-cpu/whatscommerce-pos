"use client";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export function SalesChart({ data }: { data: { day: string; total: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
        <defs>
          <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(142 71% 45%)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="hsl(142 71% 45%)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} width={48} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: "1px solid hsl(214 32% 91%)" }}
          formatter={(v: number) => [`$${v.toFixed(2)}`, "Ventas"]}
        />
        <Area type="monotone" dataKey="total" stroke="hsl(142 71% 45%)" strokeWidth={2} fill="url(#salesFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
