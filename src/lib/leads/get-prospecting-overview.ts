import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { LEAD_STATUSES, type LeadStatus } from "@/lib/leads/lead-status"
import type { ProspectingOverviewQuery } from "@/lib/leads/prospecting-overview-schema"
import type { Database } from "@/lib/supabase/database.types"

const DEFAULT_PERIOD_MONTHS = 12

export type ProspectingOverview = {
  from: string
  to: string
  totalLeads: number
  funnel: Record<LeadStatus, number>
  conversionRate: number
  projectTypeDistribution: Record<string, number>
  volumeByMonth: { month: string; count: number }[]
}

function resolvePeriod(query: ProspectingOverviewQuery): { from: string; to: string } {
  const to = query.to ?? new Date().toISOString().slice(0, 10)

  if (query.from) {
    return { from: query.from, to }
  }

  const defaultFrom = new Date(to)
  defaultFrom.setUTCMonth(defaultFrom.getUTCMonth() - DEFAULT_PERIOD_MONTHS)
  return { from: defaultFrom.toISOString().slice(0, 10), to }
}

function emptyFunnel(): Record<LeadStatus, number> {
  return Object.fromEntries(LEAD_STATUSES.map((status) => [status, 0])) as Record<
    LeadStatus,
    number
  >
}

/**
 * Aggregates the prospecting funnel for a period (FR21). Reads
 * `status`/`project_type`/`created_at` only and aggregates in memory —
 * simplest correct approach at this data volume, and avoids introducing a
 * new SQL aggregation function the project doesn't otherwise use.
 */
export async function getProspectingOverview(
  supabase: SupabaseClient<Database>,
  query: ProspectingOverviewQuery
): Promise<ProspectingOverview> {
  const { from, to } = resolvePeriod(query)

  const { data, error } = await supabase
    .from("leads")
    .select("status, project_type, created_at")
    .gte("created_at", from)
    .lt("created_at", `${to}T23:59:59.999Z`)

  if (error) {
    console.error("getProspectingOverview: failed to load leads", error)
    throw new Error("Não foi possível carregar os indicadores da prospecção.")
  }

  const rows = data ?? []
  const funnel = emptyFunnel()
  const projectTypeDistribution: Record<string, number> = {}
  const volumeByMonthMap = new Map<string, number>()

  for (const row of rows) {
    const status = row.status as LeadStatus
    if (status in funnel) {
      funnel[status] += 1
    }

    projectTypeDistribution[row.project_type] = (projectTypeDistribution[row.project_type] ?? 0) + 1

    const month = row.created_at.slice(0, 7)
    volumeByMonthMap.set(month, (volumeByMonthMap.get(month) ?? 0) + 1)
  }

  const volumeByMonth = [...volumeByMonthMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, count }))

  const totalLeads = rows.length
  const conversionRate = totalLeads > 0 ? funnel.contrato_fechado / totalLeads : 0

  return { from, to, totalLeads, funnel, conversionRate, projectTypeDistribution, volumeByMonth }
}
