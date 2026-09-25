"use client"

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

export function ExpenseCategoryChart({
  data,
}: {
  data: { category: string; amount: number }[]
}) {
  const top = data.slice(0, 8)
  const rowHeight = 34

  return (
    <div role="img" aria-label="Gráfico de barras: saídas por categoria">
      <ResponsiveContainer width="100%" height={top.length * rowHeight}>
        <BarChart data={top} layout="vertical" margin={{ top: 8, right: 72, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#292b28" horizontal={false} />
          {/* Exact values are shown via LabelList at each bar's end, not by reading this axis —
              stays legible regardless of how large a category's total grows. */}
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="category"
            stroke="#54554a"
            tick={{ fill: "#a6a7a0", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#292b28" }}
            width={120}
            interval={0}
          />
          <Tooltip
            formatter={(value: unknown) => money.format(Number(value))}
            contentStyle={{ background: "#181916", border: "1px solid #292b28", borderRadius: 8, color: "#f1f1ed" }}
          />
          <Bar dataKey="amount" name="Total" fill="#f87171" radius={[0, 4, 4, 0]} maxBarSize={20}>
            <LabelList
              dataKey="amount"
              position="right"
              formatter={(value: unknown) => money.format(Number(value))}
              fill="#f1f1ed"
              fontSize={12}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
