"use client"

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { formatMonth } from "./format-month"

const count = new Intl.NumberFormat("pt-BR")

export function LeadsVolumeChart({
  data,
}: {
  data: { month: string; count: number }[]
}) {
  return (
    <div className="min-w-0" role="img" aria-label="Gráfico de linha: volume de leads por mês">
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#292b28" vertical={false} />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            stroke="#54554a"
            tick={{ fill: "#a6a7a0", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#292b28" }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            stroke="#54554a"
            tick={{ fill: "#a6a7a0", fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tickFormatter={(value) => count.format(Number(value))}
            width={44}
          />
          <Tooltip
            labelFormatter={formatMonth}
            formatter={(value: unknown) => count.format(Number(value))}
            contentStyle={{ background: "#181916", border: "1px solid #292b28", borderRadius: 8, color: "#f1f1ed" }}
          />
          <Line
            type="monotone"
            dataKey="count"
            name="Leads"
            stroke="#fbd020"
            strokeWidth={2}
            dot={{ r: 3, fill: "#fbd020", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
