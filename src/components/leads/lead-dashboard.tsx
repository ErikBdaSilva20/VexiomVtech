import Link from "next/link"

import { Form, FormField, FormInput } from "@/components/forms/form"
import { LEAD_STATUS_LABELS } from "@/components/leads/lead-status-labels"
import { LEAD_STATUSES } from "@/lib/leads/lead-status"
import type { DailyAgendaAlerts } from "@/lib/leads/get-daily-agenda-alerts"
import type { LeadRiskAlerts } from "@/lib/leads/get-lead-risk-alerts"
import type { ProspectingOverview } from "@/lib/leads/get-prospecting-overview"

type NamedCount = { label: string; count: number }

function CountTable({ title, rows }: { title: string; rows: NamedCount[] }) {
  return (
    <section className="min-w-0 rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
      <h3 className="text-sm font-semibold text-white">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-[#85867f]">Sem dados neste período.</p>
      ) : (
        <div className="mt-4 max-h-72 overflow-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="sr-only"><tr><th>Categoria</th><th>Leads</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-[#292b28] last:border-0">
                  <th scope="row" className="py-2.5 pr-3 font-normal text-[#bdbeb6]">{row.label}</th>
                  <td className="py-2.5 text-right font-semibold tabular-nums text-white">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
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
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value + "-01T12:00:00Z"))
}

export function LeadDashboard({
  overview,
  risk,
  agenda,
  selectedDates,
  invalidPeriod,
  preservedFilters,
}: {
  overview: ProspectingOverview | null
  risk: LeadRiskAlerts | null
  agenda: DailyAgendaAlerts | null
  selectedDates: { from?: string; to?: string }
  invalidPeriod: boolean
  preservedFilters: Record<string, string | undefined>
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

  const riskGroups = risk ? [
    { label: "SLA estourado", detail: "Sem visualização após 12 horas úteis", items: risk.slaBreached },
    { label: "Sem próxima ação", detail: "Leads ativos sem acompanhamento definido", items: risk.noNextAction },
    { label: "Follow-ups vencidos", detail: "Ações marcadas para o passado", items: risk.overdueFollowUps },
    { label: "Esfriando", detail: "Sem interação há mais de 5 dias", items: risk.coolingLeads },
  ] : []
  const alertCount = riskGroups.reduce((sum, group) => sum + group.items.length, 0)
  const funnel = overview
    ? LEAD_STATUSES.map((status) => ({ label: LEAD_STATUS_LABELS[status], count: overview.funnel[status] }))
    : []
  const projectTypes = overview
    ? Object.entries(overview.projectTypeDistribution)
        .map(([label, count]) => ({ label, count }))
        .sort((left, right) => right.count - left.count)
    : []
  const monthlyVolume = overview?.volumeByMonth.map(({ month, count }) => ({
    label: formatMonth(month),
    count,
  })) ?? []

  return (
    <section aria-labelledby="lead-dashboard-title" className="mb-9">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Saúde da prospecção</p>
          <h2 id="lead-dashboard-title" className="text-xl font-semibold text-white sm:text-2xl">Visão geral</h2>
        </div>
        <Form action="/painel-8f2k/leads" method="get" className="grid w-full grid-cols-2 items-end gap-2 sm:w-auto sm:grid-cols-[minmax(145px,1fr)_minmax(145px,1fr)_auto]">
          {Object.entries(preservedFilters).map(([key, value]) => value ? <input key={key} type="hidden" name={key} value={value} /> : null)}
          <FormField htmlFor="dashboard-from" label="De">
            <FormInput id="dashboard-from" name="from" type="date" defaultValue={overview?.from ?? selectedDates.from ?? ""} />
          </FormField>
          <FormField htmlFor="dashboard-to" label="Até">
            <FormInput id="dashboard-to" name="to" type="date" defaultValue={overview?.to ?? selectedDates.to ?? ""} />
          </FormField>
          <button type="submit" className="col-span-2 min-h-11 rounded-md border border-[#4d4d43] px-4 text-sm font-medium text-[#f1f1ed] hover:border-[#fbd020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020] sm:col-span-1">Aplicar</button>
        </Form>
      </div>

      {invalidPeriod && <p role="alert" className="mb-4 text-sm text-amber-200">Período inválido; exibindo os últimos 12 meses.</p>}

      {appointments.length > 0 && (
        <section aria-labelledby="appointments-title" className="mb-5 rounded-xl border border-[#917225] bg-[#2b2512] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Atenção hoje e em atraso</p>
          <h3 id="appointments-title" className="mt-1 text-lg font-semibold text-white">Follow-ups e reuniões</h3>
          <ul className="mt-3 grid max-h-72 list-none gap-2 overflow-auto p-0 sm:grid-cols-2">
            {appointments.map((item) => (
              <li key={item.id}>
                <Link prefetch={false} href={"/painel-8f2k/leads/" + item.leadId} className="flex min-h-12 flex-wrap items-center gap-x-2 rounded-md border border-[#6d5a28] bg-[#211d12] px-3 py-2 text-sm hover:border-[#fbd020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">
                  <time dateTime={item.at} className="font-semibold text-white">{formatDateTime(item.at)}</time>
                  <span className="text-[#e5dfca]">{item.kind}: {item.lead || "Lead"}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Leads no período", value: overview ? String(overview.totalLeads) : "—" },
          { label: "Contratos fechados", value: overview ? String(overview.funnel.contrato_fechado) : "—" },
          { label: "Conversão", value: overview ? new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 }).format(overview.conversionRate) : "—" },
          { label: "Alertas ativos", value: risk ? String(alertCount) : "—" },
        ].map((item) => (
          <div key={item.label} className="min-w-0 rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-5">
            <p className="text-xs leading-5 text-[#aaa]">{item.label}</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white sm:text-3xl">{item.value}</p>
          </div>
        ))}
      </div>

      {overview ? (
        <p className="mt-3 text-xs text-[#85867f]">Dados de {overview.from} até {overview.to}. Contagens e conversão consideram esse período.</p>
      ) : (
        <p role="status" className="mt-3 text-xs text-[#b8a98a]">Os indicadores de funil estão temporariamente indisponíveis.</p>
      )}

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
        <CountTable title="Funil por status" rows={funnel} />
        <CountTable title="Tipos de projeto" rows={projectTypes} />
        <CountTable title="Volume por mês" rows={monthlyVolume} />
      </div>

      <section aria-labelledby="risk-title" className="mt-6">
        <h3 id="risk-title" className="mb-3 text-lg font-semibold text-white">Pontos de atenção</h3>
        {risk ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {riskGroups.map((group) => (
              <article key={group.label} className="rounded-xl border border-[#49382e] bg-[#1e1a17] p-4 sm:p-5">
                <p className="text-2xl font-semibold tabular-nums text-[#ffd299]">{group.items.length}</p>
                <h4 className="mt-1 text-sm font-semibold text-white">{group.label}</h4>
                <p className="mt-1 text-xs leading-5 text-[#a7a39a]">{group.detail}</p>
                {group.items.length ? (
                  <ul className="mt-3 list-none space-y-1 p-0 text-xs">
                    {group.items.slice(0, 6).map((item) => (
                      <li key={item.id}>
                        <Link prefetch={false} href={"/painel-8f2k/leads/" + item.id} className="text-[#d8d4ca] underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-[#fbd020]">
                          {item.name}{item.company ? " · " + item.company : ""}
                        </Link>
                      </li>
                    ))}
                    {group.items.length > 6 && (
                      <li className="pt-1">
                        <details>
                          <summary className="cursor-pointer text-[#e0c775] hover:text-white">
                            Ver mais {group.items.length - 6} leads
                          </summary>
                          <ul className="mt-2 list-none space-y-1 pl-3">
                            {group.items.slice(6).map((item) => (
                              <li key={item.id}>
                                <Link prefetch={false} href={"/painel-8f2k/leads/" + item.id} className="text-[#d8d4ca] underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-[#fbd020]">
                                  {item.name}{item.company ? " · " + item.company : ""}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </details>
                      </li>
                    )}
                  </ul>
                ) : <p className="mt-3 text-xs text-[#9eaa99]">Nenhum lead nesta condição.</p>}
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-[#292b28] bg-[#181916] p-5 text-sm text-[#aaa]">Os alertas de risco estão temporariamente indisponíveis.</p>
        )}
      </section>
    </section>
  )
}
