import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

/**
 * Marks a lead as viewed the first time its detail page is opened (FR11
 * AC1/AC2). Uses a single conditional `UPDATE ... WHERE viewed_at IS NULL`
 * rather than reading `viewed_at` first and then deciding whether to write:
 * that would be a check-then-act race (two admins opening the same lead at
 * the same moment could both read `null` and both write, the second
 * silently overwriting the real "first viewed" time). A single atomic
 * UPDATE has Postgres serialize concurrent writers via row locking, so only
 * the first one to commit actually changes the row — matching FR11 AC2
 * ("viewed_at não é sobrescrito") even under concurrent opens.
 *
 * Deliberately fire-and-forget from the caller's perspective: failing to
 * record "viewed" is not worth failing the page render over, so this
 * function logs and swallows errors instead of throwing (unlike the
 * read DALs in this module, e.g. `listLeads`/`listLeadInteractions`, which
 * throw because their data is required to render anything at all).
 *
 * Callers must only invoke this from the lead detail page's own render
 * path (a real admin opening the page), never from a route/loader that
 * could run on link prefetch or other passive navigation — otherwise
 * `viewed_at` could be set without an admin actually having looked at it.
 *
 * No auth check here, by design: this is a plain DAL, same posture as
 * `listLeads`/`listLeadInteractions`. `/painel-8f2k/*` middleware already
 * enforces the session/role check before any page renders, and RLS
 * (`leads_update_admins`) enforces it again at the DB layer regardless of
 * what called this function.
 */
export async function markLeadViewed(
  supabase: SupabaseClient<Database>,
  leadId: string
): Promise<void> {
  const { error } = await supabase
    .from("leads")
    .update({ viewed_at: new Date().toISOString() })
    .eq("id", leadId)
    .is("viewed_at", null)

  if (error) {
    console.error("markLeadViewed: failed to mark lead as viewed", error)
  }
}
