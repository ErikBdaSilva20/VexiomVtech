import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

type LeadMeetingRow = Database["public"]["Tables"]["lead_meetings"]["Row"]

/**
 * All meetings for a lead, past and future (FR19 AC4), ordered
 * chronologically by scheduled time. RLS (`lead_meetings_select_admins`) is
 * the enforcement layer — call with the session-aware client.
 */
export async function listLeadMeetings(
  supabase: SupabaseClient<Database>,
  leadId: string
): Promise<LeadMeetingRow[]> {
  const { data, error } = await supabase
    .from("lead_meetings")
    .select("*")
    .eq("lead_id", leadId)
    .order("scheduled_at", { ascending: true })

  if (error) {
    console.error("listLeadMeetings: query failed", error)
    throw new Error("Não foi possível carregar as reuniões do lead.")
  }

  return data ?? []
}
