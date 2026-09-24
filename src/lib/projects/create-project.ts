import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { CreateProjectInput } from "@/lib/projects/project-schema"
import { classifyWriteProjectError, type WriteProjectErrorKind } from "@/lib/projects/write-project-error"
import type { Database } from "@/lib/supabase/database.types"

export type CreateProjectResult = { ok: true; id: string } | { ok: false; error: WriteProjectErrorKind }

/**
 * Creates an internal project (FR34/5.1) — tracks any contracted work
 * regardless of whether it ever becomes a public `case`.
 */
export async function createProject(
  supabase: SupabaseClient<Database>,
  input: CreateProjectInput
): Promise<CreateProjectResult> {
  const { data, error } = await supabase.from("projects").insert(input).select("id").single()

  if (error || !data) {
    console.error("createProject: failed to insert project", error)
    return { ok: false, error: classifyWriteProjectError(error) }
  }

  return { ok: true, id: data.id }
}
