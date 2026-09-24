import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { businessHoursElapsed } from "@/lib/leads/business-hours"
import { isTerminalLeadStatus, type LeadStatus } from "@/lib/leads/lead-status"
import { MS_PER_DAY } from "@/lib/leads/sao-paulo-time"
import type { Database } from "@/lib/supabase/database.types"

const SLA_BUSINESS_HOURS_THRESHOLD = 12
const COOLING_DAYS_THRESHOLD = 5

type RiskAlertRow = {
  id: string
  name: string
  company: string | null
  status: LeadStatus
  created_at: string
  viewed_at: string | null
  next_action: string | null
  next_action_at: string | null
  last_interaction_at: string | null
}

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
    .select("id, name, company, status, created_at, viewed_at, next_action, next_action_at, last_interaction_at")

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
    if (isTerminalLeadStatus(row.status)) continue

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
