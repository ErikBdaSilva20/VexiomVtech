"use client"

import Link from "next/link"

import { Form, FormField, FormInput } from "@/components/forms/form"
import { LeadDrilldownPanel } from "@/components/leads/lead-drilldown-panel"
import { LEAD_STATUS_LABELS } from "@/components/leads/lead-status-labels"
import { useLeadDrilldown, type LeadDrilldownSlice } from "@/components/leads/use-lead-drilldown"
import type { DailyAgendaAlerts } from "@/lib/leads/get-daily-agenda-alerts"
import type { LeadRiskAlerts } from "@/lib/leads/get-lead-risk-alerts"
import type { ProspectingOverview } from "@/lib/leads/get-prospecting-overview"
import { LEAD_STATUSES } from "@/lib/leads/lead-status"
import type { Database } from "@/lib/supabase/database.types"

type LeadRow = Database["public"]["Tables"]["leads"]["Row"]

type NamedCount = { label: string; count: number; slice: LeadDrilldownSlice }

export type RiskGroup = { label: string; detail: string; items: LeadRow[]; accent: string; count: string }

/**
 * Pure — maps `getLeadRiskAlerts`'s four risk categories to the copy/style
 * each clickable count card needs. Exported for testing so the card
 * labels/counts can be asserted without rendering the component (this
 * project's vitest config has no DOM environment — see
 * `lead-drilldown-panel.test.ts`).
 */
export function buildRiskGroups(risk: LeadRiskAlerts | null): RiskGroup[] {
  if (!risk) return []
  return [
    {
      label: "SLA estourado",
      detail: "Ainda não visualizados após 12 horas úteis.",
      items: risk.slaBreached,
      accent: "border-l-red-400",
      count: "text-red-200",
    },
    {
      label: "Sem próxima ação",
      detail: "Leads ativos sem um acompanhamento definido.",
      items: risk.noNextAction,
      accent: "border-l-amber-300",
      count: "text-amber-200",
    },
    {
      label: "Follow-ups vencidos",
      detail: "Ações programadas para uma data que já passou.",
      items: risk.overdueFollowUps,
      accent: "border-l-orange-300",
      count: "text-orange-200",
    },
    {
      label: "Leads esfriando",
      detail: "Sem interação registrada há mais de cinco dias.",
      items: risk.coolingLeads,
      accent: "border-l-sky-300",
      count: "text-sky-200",
    },
  ]
}

/** Pure — first/last calendar day (America/Sao_Paulo) of a "YYYY-MM" month. Exported for testing. */
export function monthDateRange(month: string): { from: string; to: string } {
  const start = new Date(month + "-01T00:00:00Z")
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0))
  return { from: month + "-01", to: end.toISOString().slice(0, 10) }
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(value + "T12:00:00Z"))
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}

function formatMonth(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "-01T12:00:00Z"))
}

function CountPanel({
  title,
  description,
  rows,
  onRowClick,
}: {
  title: string
  description: string
  rows: NamedCount[]
  onRowClick?: (slice: LeadDrilldownSlice) => void
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-[#30362e] bg-[#171a17] p-5 sm:p-6">
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-[#9fa69c]">{description}</p>
      {rows.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-[#3d443b] px-4 py-8 text-center text-sm text-[#a9b0a6]">
          Sem dados neste período.
        </p>
      ) : (
        <dl className="mt-5 grid grid-cols-1 gap-x-7 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="border-b border-[#2c312b]">
              {onRowClick ? (
                <button
                  type="button"
                  onClick={() => onRowClick(row.slice)}
                  className="group flex min-h-11 w-full min-w-0 cursor-pointer items-center justify-between gap-4 rounded-md py-3 text-left transition hover:bg-[#1c201c] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]"
                >
                  <dt className="text-sm leading-5 text-[#d2d7cf] transition group-hover:translate-x-0.5">{row.label}</dt>
                  <dd className="shrink-0 rounded-md bg-[#222720] px-2.5 py-1 text-sm font-semibold tabular-nums text-white transition group-hover:bg-[#2c3227] group-hover:scale-105">
                    {row.count}
                  </dd>
                </button>
              ) : (
                <div className="flex min-w-0 items-center justify-between gap-4 py-3">
                  <dt className="text-sm leading-5 text-[#d2d7cf]">{row.label}</dt>
                  <dd className="shrink-0 rounded-md bg-[#222720] px-2.5 py-1 text-sm font-semibold tabular-nums text-white">
                    {row.count}
                  </dd>
                </div>
              )}
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}

export function LeadOverview({
  overview,
  selectedDates,
  invalidPeriod,
  onRowClick,
}: {
  overview: ProspectingOverview | null
  selectedDates: { from?: string; to?: string }
  invalidPeriod: boolean
  onRowClick: (slice: LeadDrilldownSlice) => void
}) {
  const funnel = overview
    ? LEAD_STATUSES.map((status) => ({
        label: LEAD_STATUS_LABELS[status],
        count: overview.funnel[status],
        slice: { kind: "status" as const, value: status, label: LEAD_STATUS_LABELS[status] },
      }))
    : []
  const projectTypes = overview
    ? Object.entries(overview.projectTypeDistribution)
        .map(([label, count]) => ({
          label,
          count,
          slice: { kind: "project_type" as const, value: label, label },
        }))
        .sort((left, right) => right.count - left.count)
    : []
  const monthlyVolume = overview?.volumeByMonth.map(({ month, count }) => {
    const label = formatMonth(month)
    const { from, to } = monthDateRange(month)
    return { label, count, slice: { kind: "month" as const, from, to, label } }
  }) ?? []
  const activeLeads = overview
    ? overview.totalLeads
      - overview.funnel.contrato_fechado
      - overview.funnel.nao_convertido
      - overview.funnel.em_suporte_continuo
    : null

  return (
    <section aria-labelledby="overview-title">
      <div className="mb-6 flex flex-col gap-5 rounded-2xl border border-[#30362e] bg-[#171a17] p-5 sm:p-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Desempenho comercial</p>
          <h2 id="overview-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">Visão geral</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-[#aeb5ab]">
            Acompanhe o volume e a evolução das oportunidades no período escolhido.
          </p>
        </div>
        <Form action="/painel-8f2k/leads" method="get" className="grid w-full grid-cols-2 items-end gap-3 lg:w-auto lg:grid-cols-[minmax(150px,1fr)_minmax(150px,1fr)_auto]">
          <input type="hidden" name="section" value="overview" />
          <FormField htmlFor="dashboard-from" label="Data inicial">
            <FormInput id="dashboard-from" name="from" type="date" defaultValue={overview?.from ?? selectedDates.from ?? ""} />
          </FormField>
          <FormField htmlFor="dashboard-to" label="Data final">
            <FormInput id="dashboard-to" name="to" type="date" defaultValue={overview?.to ?? selectedDates.to ?? ""} />
          </FormField>
          <button type="submit" className="col-span-2 min-h-11 rounded-lg bg-[#fbd020] px-5 text-sm font-semibold text-[#17140a] transition hover:bg-[#ffe15b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020] lg:col-span-1">
            Atualizar
          </button>
        </Form>
      </div>

      {invalidPeriod && (
        <p role="alert" className="mb-5 rounded-lg border border-amber-800/60 bg-amber-950/30 px-4 py-3 text-sm text-amber-100">
          O período informado é inválido. Estamos exibindo os últimos 12 meses.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Leads recebidos",
            value: overview ? String(overview.totalLeads) : "—",
            detail: "no período",
            color: "text-white",
          },
          {
            label: "Em andamento",
            value: activeLeads === null ? "—" : String(Math.max(0, activeLeads)),
            detail: "oportunidades ativas",
            color: "text-[#fbd020]",
          },
          {
            label: "Contratos fechados",
            value: overview ? String(overview.funnel.contrato_fechado) : "—",
            detail: "convertidos",
            color: "text-emerald-300",
          },
          {
            label: "Taxa de conversão",
            value: overview
              ? new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(overview.conversionRate)
              : "—",
            detail: "sobre o total",
            color: "text-[#9ed7ff]",
          },
        ].map((item) => (
          <article key={item.label} className="min-w-0 rounded-2xl border border-[#30362e] bg-[#171a17] p-4 sm:p-5">
            <p className="text-xs font-medium leading-5 text-[#afb6ac]">{item.label}</p>
            <p className={"mt-2 text-3xl font-semibold tabular-nums tracking-tight sm:text-4xl " + item.color}>{item.value}</p>
            <p className="mt-1 text-xs text-[#858d82]">{item.detail}</p>
          </article>
        ))}
      </div>

      {overview ? (
        <p className="mt-3 text-xs text-[#929a90]">
          Período analisado: {formatDate(overview.from)} a {formatDate(overview.to)}.
        </p>
      ) : (
        <p role="status" className="mt-4 rounded-lg border border-[#4d412c] bg-[#211d14] px-4 py-3 text-sm text-[#e0cfa8]">
          Os indicadores estão temporariamente indisponíveis.
        </p>
      )}

      {overview?.totalLeads === 0 ? (
        <section className="mt-6 rounded-2xl border border-dashed border-[#3c443a] bg-[#141714] px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-white">Nenhum lead neste período</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#a9b0a6]">
            Altere as datas acima para consultar outro intervalo ou cadastre uma nova oportunidade.
          </p>
        </section>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">
          <CountPanel
            title="Funil por etapa"
            description="Quantidade de oportunidades em cada momento comercial."
            rows={funnel}
            onRowClick={onRowClick}
          />
          <CountPanel
            title="Tipos de projeto"
            description="Demandas mais procuradas pelos contatos recebidos."
            rows={projectTypes}
            onRowClick={onRowClick}
          />
          <div className="xl:col-span-2">
            <CountPanel
              title="Leads recebidos por mês"
              description="Histórico mensal dentro do período selecionado."
              rows={monthlyVolume}
              onRowClick={onRowClick}
            />
          </div>
        </div>
      )}
    </section>
  )
}

export function LeadAlerts({
  risk,
  agenda,
  onOpenRisk,
}: {
  risk: LeadRiskAlerts | null
  agenda: DailyAgendaAlerts | null
  onOpenRisk: (label: string, leads: LeadRow[]) => void
}) {
  const appointments = agenda
    ? [
        ...agenda.followUps.map((item) => ({
          id: "follow-" + item.leadId,
          leadId: item.leadId,
          lead: item.leadName,
          kind: "Follow-up",
          at: item.nextActionAt,
        })),
        ...agenda.meetings.map((item) => ({
          id: "meeting-" + item.meetingId,
          leadId: item.leadId,
          lead: item.leadName,
          kind: "Reunião",
          at: item.scheduledAt,
        })),
      ].sort((left, right) => left.at.localeCompare(right.at))
    : []

  const riskGroups = buildRiskGroups(risk)
  const hasRiskAlerts = riskGroups.some((group) => group.items.length > 0)
  const alertCount = riskGroups.reduce((sum, group) => sum + group.items.length, 0)
  const urgentCount = risk ? risk.slaBreached.length + risk.overdueFollowUps.length : null

  return (
    <section aria-labelledby="alerts-title">
      <header className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Prioridades comerciais</p>
        <h2 id="alerts-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">Alertas e agenda</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5ab]">
          Comece pelo que está atrasado ou exige contato imediato.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: "Sinais de atenção", value: risk ? alertCount : null, color: "text-amber-200" },
          { label: "Urgentes", value: urgentCount, color: "text-red-200" },
          { label: "Agenda até hoje", value: agenda ? appointments.length : null, color: "text-[#fbd020]" },
        ].map((item) => (
          <article key={item.label} className="rounded-2xl border border-[#30362e] bg-[#171a17] p-5">
            <p className="text-xs font-medium text-[#afb6ac]">{item.label}</p>
            <p className={"mt-2 text-3xl font-semibold tabular-nums " + item.color}>{item.value ?? "—"}</p>
          </article>
        ))}
      </div>

      {appointments.length > 0 && (
        <section aria-labelledby="agenda-title" className="mt-6 overflow-hidden rounded-2xl border border-[#6b5a24] bg-[#1c1a12]">
          <div className="border-b border-[#51461f] px-5 py-4 sm:px-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#fbd020]">Hoje e em atraso</p>
            <h3 id="agenda-title" className="mt-1 text-lg font-semibold text-white">Compromissos que pedem ação</h3>
          </div>
          <ul className="grid list-none gap-px bg-[#39331d] p-0 md:grid-cols-2">
            {appointments.map((item) => (
              <li key={item.id} className="bg-[#1c1a12]">
                <Link
                  prefetch={false}
                  href={"/painel-8f2k/leads/" + item.leadId}
                  className="flex min-h-20 flex-col justify-center gap-1 px-5 py-4 transition hover:bg-[#252217] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#fbd020] sm:px-6"
                >
                  <span className="text-xs font-semibold uppercase tracking-[0.1em] text-[#d9c66a]">{item.kind}</span>
                  <span className="text-sm font-semibold text-white">{item.lead || "Lead"}</span>
                  <time dateTime={item.at} className="text-xs text-[#b8b39e]">{formatDateTime(item.at)}</time>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {risk === null ? (
        <p role="status" className="mt-6 rounded-xl border border-[#4d412c] bg-[#211d14] px-4 py-4 text-sm text-[#e0cfa8]">
          Os alertas de risco estão temporariamente indisponíveis.
        </p>
      ) : !hasRiskAlerts ? (
        <section className="mt-6 rounded-2xl border border-emerald-900/70 bg-emerald-950/20 px-6 py-12 text-center">
          <p className="text-2xl" aria-hidden="true">✓</p>
          <h3 className="mt-2 text-lg font-semibold text-emerald-100">Nenhuma pendência crítica</h3>
          <p className="mt-2 text-sm text-[#adc4b3]">Os leads ativos estão dentro dos critérios de acompanhamento.</p>
        </section>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {riskGroups.map((group) => {
            const clickable = group.items.length > 0
            return (
              <button
                key={group.label}
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onOpenRisk(group.label, group.items)}
                className={
                  "flex min-h-[152px] min-w-0 flex-col justify-between rounded-2xl border border-[#343a32] border-l-4 bg-[#171a17] p-5 text-left transition sm:p-6 " +
                  group.accent +
                  (clickable
                    ? " cursor-pointer hover:border-[#646d60] hover:bg-[#1d211c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]"
                    : " cursor-default opacity-60")
                }
              >
                <div>
                  <h3 className="text-base font-semibold text-white">{group.label}</h3>
                  <p className="mt-1 text-sm leading-5 text-[#aab1a7]">{group.detail}</p>
                </div>
                <div className="mt-4 flex items-end justify-between">
                  <span className={"text-3xl font-semibold tabular-nums " + group.count}>{group.items.length}</span>
                  {clickable && <span aria-hidden="true" className="text-[#fbd020]">→</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      {agenda === null && (
        <p role="status" className="mt-4 text-sm text-[#c7b98e]">A agenda do dia não pôde ser carregada agora.</p>
      )}
    </section>
  )
}

/**
 * Alertas + Visão geral, stacked, sharing a single `useLeadDrilldown`
 * instance and drill-down panel. Both sections are always mounted together
 * on `/painel-8f2k/leads` now that the section selector is gone, so one
 * hoisted instance (rather than one per section) is enough and avoids two
 * modals fighting for the same escape-key/focus-trap behavior.
 */
export function LeadOverviewAndAlerts({
  overview,
  selectedDates,
  invalidPeriod,
  adminId,
  risk,
  agenda,
}: {
  overview: ProspectingOverview | null
  selectedDates: { from?: string; to?: string }
  invalidPeriod: boolean
  adminId: string
  risk: LeadRiskAlerts | null
  agenda: DailyAgendaAlerts | null
}) {
  const drilldown = useLeadDrilldown()

  return (
    <>
      <LeadAlerts risk={risk} agenda={agenda} onOpenRisk={drilldown.openWithLeads} />

      <div className="mt-10">
        <LeadOverview
          overview={overview}
          selectedDates={selectedDates}
          invalidPeriod={invalidPeriod}
          onRowClick={drilldown.open}
        />
      </div>

      <LeadDrilldownPanel state={drilldown.state} close={drilldown.close} adminId={adminId} />
    </>
  )
}
