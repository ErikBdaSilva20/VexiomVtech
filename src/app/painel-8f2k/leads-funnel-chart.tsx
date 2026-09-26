"use client"

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import type { LeadStatus } from "@/lib/leads/lead-status"

// Short axis labels avoid two-line wraps that overlap adjacent rows at this chart's row height.
// The full name is still shown in the tooltip.
const STATUS_LABELS: Record<LeadStatus, string> = {
  novo_lead: "Novo lead",
  em_analise: "Em análise",
  primeiro_contato_realizado: "1º contato",
  conversa_agendada: "Agendado",
  proposta_em_preparacao: "Prep. proposta",
  proposta_enviada: "Proposta enviada",
  follow_up_pendente: "Follow-up",
  contrato_fechado: "Fechado",
  nao_convertido: "Não convertido",
  em_suporte_continuo: "Em suporte",
}

const STATUS_FULL_LABELS: Record<LeadStatus, string> = {
  novo_lead: "Novo lead",
  em_analise: "Em análise",
  primeiro_contato_realizado: "1º contato realizado",
  conversa_agendada: "Conversa agendada",
  proposta_em_preparacao: "Proposta em preparação",
  proposta_enviada: "Proposta enviada",
  follow_up_pendente: "Follow-up pendente",
  contrato_fechado: "Contrato fechado",
  nao_convertido: "Não convertido",
  em_suporte_continuo: "Em suporte contínuo",
}

const TERMINAL_COLOR: Record<string, string> = {
  contrato_fechado: "#34d399",
  nao_convertido: "#f87171",
}

const count = new Intl.NumberFormat("pt-BR")

export function LeadsFunnelChart({
  funnel,
}: {
  funnel: Record<LeadStatus, number>
}) {
  const data = (Object.keys(funnel) as LeadStatus[]).map((status) => ({
    status,
    label: STATUS_LABELS[status],
    fullLabel: STATUS_FULL_LABELS[status],
    count: funnel[status],
  }))
  const rowHeight = 40
  const maxCount = Math.max(...data.map((item) => item.count), 1)

  return (
    <div className="min-w-0" role="img" aria-label="Gráfico de barras: leads por status">
      <div className="space-y-2.5 sm:hidden" aria-hidden="true">
        {data.map((item) => (
          <div key={item.status} className="min-w-0">
            <div className="mb-1 flex min-w-0 items-center justify-between gap-3 text-xs">
              <span className="truncate text-[#c5cac2]">{item.fullLabel}</span>
              <span className="shrink-0 tabular-nums text-[#e5e7e2]">{count.format(item.count)}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#292b28]">
              <div className="h-full rounded-full" style={{ backgroundColor: TERMINAL_COLOR[item.status] ?? "#fbd020", width: Math.max(4, (item.count / maxCount) * 100) + "%" }} />
            </div>
          </div>
        ))}
      </div>
      <div className="hidden min-w-0 sm:block">
      <ResponsiveContainer width="100%" height={data.length * rowHeight}>
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 32, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="#292b28" horizontal={false} />
          {/* Exact values are shown via LabelList at each bar's end, not by reading this axis — stays
              legible regardless of how large a status's count grows. */}
          <XAxis type="number" allowDecimals={false} hide />
          <YAxis
            type="category"
            dataKey="label"
            stroke="#54554a"
            tick={{ fill: "#a6a7a0", fontSize: 12 }}
            tickLine={false}
            axisLine={{ stroke: "#292b28" }}
            width={112}
            interval={0}
          />
          <Tooltip
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ""}
            formatter={(value: unknown) => count.format(Number(value))}
            contentStyle={{ background: "#181916", border: "1px solid #292b28", borderRadius: 8, color: "#f1f1ed" }}
          />
          <Bar dataKey="count" name="Leads" radius={[0, 4, 4, 0]} maxBarSize={18}>
            {data.map((entry) => (
              <Cell key={entry.status} fill={TERMINAL_COLOR[entry.status] ?? "#fbd020"} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              formatter={(value: unknown) => count.format(Number(value))}
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
