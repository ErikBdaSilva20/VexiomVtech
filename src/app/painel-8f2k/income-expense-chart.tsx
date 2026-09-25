"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { formatMonth } from "./format-month"

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })

export function IncomeExpenseChart({
  data,
}: {
  data: { month: string; income: number; expense: number }[]
}) {
  return (
    <div role="img" aria-label="Gráfico de barras: entradas e saídas por mês">
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
          <CartesianGrid stroke="#292b28" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            stroke="#54554a"
            tick={{ fill: "#a6a7a0", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#292b28" }}
          />
          <YAxis
            stroke="#54554a"
            tick={{ fill: "#a6a7a0", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => money.format(Number(value))}
            width={72}
          />
          <Tooltip
            formatter={(value: unknown) => money.format(Number(value))}
            labelFormatter={formatMonth}
            contentStyle={{ background: "#181916", border: "1px solid #292b28", borderRadius: 8, color: "#f1f1ed" }}
          />
          <Legend wrapperStyle={{ color: "#a6a7a0", fontSize: 12 }} />
          <Bar dataKey="income" name="Entradas" fill="#34d399" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Saídas" fill="#f87171" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
