import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { businessHoursElapsed } from "@/lib/leads/business-hours"
import { isTerminalLeadStatus, type LeadStatus } from "@/lib/leads/lead-status"
import { MS_PER_DAY } from "@/lib/leads/sao-paulo-time"
import type { Database } from "@/lib/supabase/database.types"

const SLA_BUSINESS_HOURS_THRESHOLD = 12
const COOLING_DAYS_THRESHOLD = 5

// Full `leads` row (not a narrow projection) so risk-category drill-downs
// can reuse `LeadListItem` as-is instead of a second, duplicate item
// component (see `use-lead-drilldown.ts`'s `openWithLeads`).
type RiskAlertRow = Database["public"]["Tables"]["leads"]["Row"]

export type LeadRiskAlerts = {
  slaBreached: RiskAlertRow[]
  noNextAction: RiskAlertRow[]
  overdueFollowUps: RiskAlertRow[]
  coolingLeads: RiskAlertRow[]
}

/**
 * Computes the risk-alert lists for FR22-25 (3.2): SLA breach, missing next
 * action, overdue follow-up, and cooling leads. Terminal-status leads are
 * excluded from every list by construction — the AC is explicit that a
 * closed/lost/supported lead is never "at risk".
 *
 * Reads once and categorizes in memory, same approach as
 * `getProspectingOverview` (3.1) — no new SQL, no evidence the lead volume
 * justifies a DB-side computation.
 */
export async function getLeadRiskAlerts(
  supabase: SupabaseClient<Database>,
  now: Date = new Date()
): Promise<LeadRiskAlerts> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")

  if (error) {
    console.error("getLeadRiskAlerts: failed to load leads", error)
    throw new Error("Não foi possível carregar os alertas de risco da prospecção.")
  }

  const alerts: LeadRiskAlerts = {
    slaBreached: [],
    noNextAction: [],
    overdueFollowUps: [],
    coolingLeads: [],
  }

  for (const row of (data ?? []) as RiskAlertRow[]) {
    if (isTerminalLeadStatus(row.status as LeadStatus)) continue

    if (!row.viewed_at && businessHoursElapsed(new Date(row.created_at), now) > SLA_BUSINESS_HOURS_THRESHOLD) {
      alerts.slaBreached.push(row)
    }

    if (!row.next_action) {
      alerts.noNextAction.push(row)
    }

    if (row.next_action_at && new Date(row.next_action_at).getTime() < now.getTime()) {
      alerts.overdueFollowUps.push(row)
    }

    const coolingCutoffMs = now.getTime() - COOLING_DAYS_THRESHOLD * MS_PER_DAY
    if (!row.last_interaction_at || new Date(row.last_interaction_at).getTime() < coolingCutoffMs) {
      alerts.coolingLeads.push(row)
    }
  }

  return alerts
}
