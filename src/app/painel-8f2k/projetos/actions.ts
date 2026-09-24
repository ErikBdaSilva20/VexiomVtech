"use server"

import { createProject } from "@/lib/projects/create-project"
import { createProjectSchema, updateProjectSchema } from "@/lib/projects/project-schema"
import { updateProject } from "@/lib/projects/update-project"
import type { WriteProjectErrorKind } from "@/lib/projects/write-project-error"
import { requireSuperAdmin } from "@/lib/auth/require-super-admin"
import { textFormValue } from "@/lib/forms/text-form-value"
import { createClient } from "@/lib/supabase/server"

const ERROR_MESSAGES: Record<WriteProjectErrorKind, string> = {
  invalid_lead: "O lead selecionado não existe.",
  unknown: "Não foi possível salvar o projeto.",
}

const ROLE_DENIED_MESSAGE = "Apenas super_admin pode gerenciar projetos."

export type CreateProjectState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; id: string }
  | undefined

export async function createProjectAction(
  _prevState: CreateProjectState,
  formData: FormData
): Promise<CreateProjectState> {
  const auth = await requireSuperAdmin(ROLE_DENIED_MESSAGE)
  if (!auth.ok) return { status: "error", error: auth.error }

  const parsed = createProjectSchema.safeParse({
    title: textFormValue(formData, "title"),
    client_name: textFormValue(formData, "client_name"),
    lead_id: textFormValue(formData, "lead_id"),
    status: textFormValue(formData, "status"),
    started_at: textFormValue(formData, "started_at"),
    finished_at: textFormValue(formData, "finished_at"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      error: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const result = await createProject(supabase, parsed.data)

  if (!result.ok) {
    return { status: "error", error: ERROR_MESSAGES[result.error] }
  }

  return { status: "success", id: result.id }
}

export type UpdateProjectState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success" }
  | undefined

export async function updateProjectAction(
  _prevState: UpdateProjectState,
  formData: FormData
): Promise<UpdateProjectState> {
  const auth = await requireSuperAdmin(ROLE_DENIED_MESSAGE)
  if (!auth.ok) return { status: "error", error: auth.error }

  const parsed = updateProjectSchema.safeParse({
    project_id: textFormValue(formData, "project_id"),
    title: textFormValue(formData, "title"),
    client_name: textFormValue(formData, "client_name"),
    lead_id: textFormValue(formData, "lead_id"),
    status: textFormValue(formData, "status"),
    started_at: textFormValue(formData, "started_at"),
    finished_at: textFormValue(formData, "finished_at"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      error: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const result = await updateProject(supabase, parsed.data)

  if (!result.ok) {
    return { status: "error", error: ERROR_MESSAGES[result.error] }
  }

  return { status: "success" }
}
