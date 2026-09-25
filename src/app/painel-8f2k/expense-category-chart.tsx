"use client"

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

export function ExpenseCategoryChart({
  data,
}: {
  data: { category: string; amount: number }[]
}) {
  const top = data.slice(0, 8)

  return (
    <div role="img" aria-label="Gráfico de barras: saídas por categoria">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={top} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#292b28" horizontal={false} />
          <XAxis
            type="number"
            stroke="#54554a"
            tick={{ fill: "#a6a7a0", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => money.format(Number(value))}
          />
          <YAxis
            type="category"
            dataKey="category"
            stroke="#54554a"
            tick={{ fill: "#a6a7a0", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#292b28" }}
            width={120}
          />
          <Tooltip
            formatter={(value: unknown) => money.format(Number(value))}
            contentStyle={{ background: "#181916", border: "1px solid #292b28", borderRadius: 8, color: "#f1f1ed" }}
          />
          <Bar dataKey="amount" name="Total" fill="#f87171" radius={[0, 4, 4, 0]} maxBarSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
