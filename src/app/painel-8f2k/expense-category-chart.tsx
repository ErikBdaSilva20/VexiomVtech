"use client"

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
const moneyCompact = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 })

export function ExpenseCategoryChart({
  data,
}: {
  data: { category: string; amount: number }[]
}) {
  const top = data.slice(0, 8)
  const rowHeight = 40
  const maxAmount = Math.max(...top.map((item) => item.amount), 1)

  return (
    <div className="min-w-0" role="img" aria-label="Gráfico de barras: saídas por categoria">
      <div className="space-y-3 sm:hidden" aria-hidden="true">
        {top.map((item) => (
          <div key={item.category} className="min-w-0">
            <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-xs">
              <span className="truncate text-[#c5cac2]">{item.category}</span>
              <span className="shrink-0 tabular-nums text-[#e5e7e2]">{money.format(item.amount)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#292b28]">
              <div className="h-full rounded-full bg-[#f87171]" style={{ width: Math.max(4, (item.amount / maxAmount) * 100) + "%" }} />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden min-w-0 sm:block">
      <ResponsiveContainer width="100%" height={top.length * rowHeight}>
        <BarChart data={top} layout="vertical" margin={{ top: 8, right: 68, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#292b28" horizontal={false} />
          {/* Exact values are shown via LabelList at each bar's end, not by reading this axis -
              stays legible regardless of how large a category's total grows. */}
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="category"
            stroke="#54554a"
            tick={{ fill: "#a6a7a0", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#292b28" }}
            width={104}
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
              formatter={(value: unknown) => moneyCompact.format(Number(value))}
              fill="#f1f1ed"
              fontSize={11}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  )
}
