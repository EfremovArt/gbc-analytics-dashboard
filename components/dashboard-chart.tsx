"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { formatCurrency, formatDateLabel } from "../lib/format";
import type { DashboardSeriesPoint } from "../lib/types";

type DashboardChartProps = {
  data: DashboardSeriesPoint[];
};

export function DashboardChart({ data }: DashboardChartProps) {
  if (data.length === 0) {
    return <div className="empty-state">После синхронизации заказов здесь появится график.</div>;
  }

  return (
    <div className="chart-shell">
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.16)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateLabel}
            tickLine={false}
            axisLine={false}
            minTickGap={24}
          />
          <YAxis
            yAxisId="left"
            tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
            tickLine={false}
            axisLine={false}
            width={54}
          />
          <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} width={40} />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "1px solid rgba(148, 163, 184, 0.18)",
              borderRadius: 16,
              color: "#f8fafc"
            }}
            formatter={(value: number, name: string) => {
              if (name === "Выручка") {
                return [formatCurrency(value), name];
              }

              return [value, name];
            }}
            labelFormatter={(label: string | number) => formatDateLabel(String(label))}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="revenue" name="Выручка" fill="#7c3aed" radius={[10, 10, 0, 0]} />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="orders"
            name="Заказы"
            stroke="#22c55e"
            strokeWidth={3}
            dot={{ r: 4, fill: "#22c55e" }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
