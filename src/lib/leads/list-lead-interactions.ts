import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

type LeadInteractionRow = Database["public"]["Tables"]["lead_interactions"]["Row"]

/**
 * Full timeline for one lead (FR9), oldest first so the UI can render it as
 * a chronological log. RLS (`lead_interactions_select_admins`) is the
 * enforcement layer — call with the session-aware client.
 */
export async function listLeadInteractions(
  supabase: SupabaseClient<Database>,
  leadId: string
): Promise<LeadInteractionRow[]> {
  const { data, error } = await supabase
    .from("lead_interactions")
    .select("*")
    .eq("lead_id", leadId)
    .order("occurred_at", { ascending: true })

  if (error) {
    console.error("listLeadInteractions: query failed", error)
    throw new Error("Não foi possível carregar o histórico do lead.")
  }

  return data ?? []
}
