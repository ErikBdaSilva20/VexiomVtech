import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { isTerminalLeadStatus, type LeadStatus } from "@/lib/leads/lead-status"
import { startOfNextLocalDay } from "@/lib/leads/sao-paulo-time"
import type { Database } from "@/lib/supabase/database.types"

type FollowUpAlert = {
  leadId: string
  leadName: string
  nextActionAt: string
}

type MeetingAlert = {
  meetingId: string
  leadId: string
  leadName: string
  scheduledAt: string
}

export type DailyAgendaAlerts = {
  followUps: FollowUpAlert[]
  meetings: MeetingAlert[]
}

/**
 * Today's (or overdue, unresolved) follow-ups and meetings for the
 * attention-grabbing banner on `/painel-8f2k` and `/painel-8f2k/leads`
 * (FR26/3.3). "Today" is the America/Sao_Paulo calendar day.
 */
export async function getDailyAgendaAlerts(
  supabase: SupabaseClient<Database>,
  now: Date = new Date()
): Promise<DailyAgendaAlerts> {
  const cutoff = startOfNextLocalDay(now).toISOString()

  const [leadsResult, meetingsResult] = await Promise.all([
    supabase
      .from("leads")
      .select("id, name, status, next_action_at")
      .not("next_action_at", "is", null)
      .lt("next_action_at", cutoff),
    supabase
      .from("lead_meetings")
      .select("id, lead_id, scheduled_at")
      .eq("status", "agendada")
      .lt("scheduled_at", cutoff),
  ])

  if (leadsResult.error) {
    console.error("getDailyAgendaAlerts: failed to load lead follow-ups", leadsResult.error)
    throw new Error("Não foi possível carregar os compromissos do dia.")
  }

  if (meetingsResult.error) {
    console.error("getDailyAgendaAlerts: failed to load lead meetings", meetingsResult.error)
    throw new Error("Não foi possível carregar os compromissos do dia.")
  }

  type FollowUpRow = { id: string; name: string; status: LeadStatus; next_action_at: string }
  const followUps = ((leadsResult.data ?? []) as FollowUpRow[])
    .filter((row) => !isTerminalLeadStatus(row.status))
    .map((row) => ({ leadId: row.id, leadName: row.name, nextActionAt: row.next_action_at }))

  type MeetingRow = { id: string; lead_id: string; scheduled_at: string }
  const meetingRows = (meetingsResult.data ?? []) as MeetingRow[]

  const leadIds = [...new Set(meetingRows.map((row) => row.lead_id))]
  const leadNames = new Map<string, string>()

  if (leadIds.length > 0) {
    const { data: meetingLeads, error: meetingLeadsError } = await supabase
      .from("leads")
      .select("id, name")
      .in("id", leadIds)

    if (meetingLeadsError) {
      console.error("getDailyAgendaAlerts: failed to load meeting lead names", meetingLeadsError)
      throw new Error("Não foi possível carregar os compromissos do dia.")
    }

    for (const lead of meetingLeads ?? []) {
      leadNames.set(lead.id, lead.name)
    }
  }

  const meetings = meetingRows.map((row) => ({
    meetingId: row.id,
    leadId: row.lead_id,
    leadName: leadNames.get(row.lead_id) ?? "",
    scheduledAt: row.scheduled_at,
  }))

  return { followUps, meetings }
}
