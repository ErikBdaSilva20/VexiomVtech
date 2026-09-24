import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

type LeadUpdate = Database["public"]["Tables"]["leads"]["Update"]

export type UpdateLeadFieldsResult = { ok: true } | { ok: false; error: unknown }

/**
 * Shared plumbing for the story 2.8 "qualify lead" Server Actions
 * (next_action, probability, tags, non_conversion_reason): each field is
 * its own action/schema (matching the epic's separate ACs and avoiding one
 * kitchen-sink update with ambiguous partial semantics), but they all
 * perform the same plain update-and-verify round trip, so that part is
 * factored out here instead of being copy-pasted four times.
 *
 * `assigned_to` (FR18) does NOT use this helper — it needs an extra
 * optimistic-concurrency condition (see `updateLeadAssignee` in
 * `[id]/actions.ts`), which doesn't fit this helper's plain
 * `eq("id", leadId)`-only shape without resorting to unsafe generic query
 * typing.
 */
export async function updateLeadFields(
  supabase: SupabaseClient<Database>,
  leadId: string,
  fields: LeadUpdate
): Promise<UpdateLeadFieldsResult> {
  const { data, error } = await supabase
    .from("leads")
    .update(fields)
    .eq("id", leadId)
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error }
  }

  return { ok: true }
}
