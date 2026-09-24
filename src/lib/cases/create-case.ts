import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { CreateCaseInput } from "@/lib/cases/case-schema"
import { classifyWriteCaseError, type WriteCaseErrorKind } from "@/lib/cases/write-case-error"
import type { Database } from "@/lib/supabase/database.types"

export type CreateCaseResult = { ok: true; id: string } | { ok: false; error: WriteCaseErrorKind }

/**
 * Creates a case as a draft (FR27/4.1) — `published` is never accepted here,
 * only `updateCase` can flip it, so every case starts as `published: false`
 * regardless of what a client sends.
 */
export async function createCase(
  supabase: SupabaseClient<Database>,
  input: CreateCaseInput
): Promise<CreateCaseResult> {
  const { data, error } = await supabase
    .from("cases")
    .insert({ ...input, published: false })
    .select("id")
    .single()

  if (error || !data) {
    console.error("createCase: failed to insert case", error)
    return { ok: false, error: classifyWriteCaseError(error) }
  }

  return { ok: true, id: data.id }
}
