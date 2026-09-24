import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { UpdateProjectInput } from "@/lib/projects/project-schema"
import { classifyWriteProjectError, type WriteProjectErrorKind } from "@/lib/projects/write-project-error"
import type { Database } from "@/lib/supabase/database.types"

export type UpdateProjectResult = { ok: true } | { ok: false; error: WriteProjectErrorKind }

/**
 * Updates every editable field of an existing project, including `status`
 * — this is also how a project moves to `concluido`/`cancelado` (FR34/5.1).
 *
 * No optimistic-concurrency guard: like `cases`, projects are edited by a
 * single super_admin persona, not contended between multiple admins acting
 * on the same record — a last-write-wins update is an acceptable
 * simplification here.
 */
export async function updateProject(
  supabase: SupabaseClient<Database>,
  input: UpdateProjectInput
): Promise<UpdateProjectResult> {
  const { project_id, ...fields } = input

  const { data, error } = await supabase.from("projects").update(fields).eq("id", project_id).select("id").single()

  if (error || !data) {
    console.error("updateProject: failed to update project", error)
    return { ok: false, error: classifyWriteProjectError(error) }
  }

  return { ok: true }
}
