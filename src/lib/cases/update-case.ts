import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { UpdateCaseInput } from "@/lib/cases/case-schema"
import { classifyWriteCaseError, type WriteCaseErrorKind } from "@/lib/cases/write-case-error"
import type { Database } from "@/lib/supabase/database.types"

export type UpdateCaseResult = { ok: true } | { ok: false; error: WriteCaseErrorKind }

/**
 * Updates every editable field of an existing case, including `published`
 * and `display_order` — this is also how a draft gets published and how the
 * portfolio's manual ordering is adjusted (FR27/4.1).
 *
 * No optimistic-concurrency guard: unlike the leads domain, cases are edited
 * by a single super_admin persona, not contended between multiple admins
 * acting on the same record — a last-write-wins update is an acceptable
 * simplification here.
 */
export async function updateCase(
  supabase: SupabaseClient<Database>,
  input: UpdateCaseInput
): Promise<UpdateCaseResult> {
  const { case_id, ...fields } = input

  const { data, error } = await supabase.from("cases").update(fields).eq("id", case_id).select("id").single()

  if (error || !data) {
    console.error("updateCase: failed to update case", error)
    return { ok: false, error: classifyWriteCaseError(error) }
  }

  return { ok: true }
}
