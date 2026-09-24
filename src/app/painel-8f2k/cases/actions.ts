"use server"

import { createCase } from "@/lib/cases/create-case"
import { createCaseSchema, updateCaseSchema } from "@/lib/cases/case-schema"
import { updateCase } from "@/lib/cases/update-case"
import type { WriteCaseErrorKind } from "@/lib/cases/write-case-error"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"

const ERROR_MESSAGES: Record<WriteCaseErrorKind, string> = {
  duplicate_slug: "Esse endereço (slug) já está em uso por outro case.",
  invalid_project: "O projeto interno selecionado não existe.",
  unknown: "Não foi possível salvar o case.",
}

// A `FormData` field that's absent (not present as a key at all) arrives as
// `null` — a plain <input> whose value is an empty string still arrives as
// `""`, which schemas here validate normally (most case fields are required).
function textFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

// Unchecked checkboxes are omitted from FormData entirely — only a checked
// box sends a value (the form uses `"on"` implicitly via the browser default).
function checkboxFormValue(formData: FormData, key: string): boolean {
  return formData.get(key) !== null
}

async function requireSuperAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { ok: false as const, error: "Sessão expirada. Faça login novamente." }
  }
  if (admin.role !== "super_admin") {
    return { ok: false as const, error: "Apenas super_admin pode gerenciar cases." }
  }
  return { ok: true as const, admin }
}

export type CreateCaseState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; id: string }
  | undefined

export async function createCaseAction(
  _prevState: CreateCaseState,
  formData: FormData
): Promise<CreateCaseState> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { status: "error", error: auth.error }

  const parsed = createCaseSchema.safeParse({
    title: textFormValue(formData, "title"),
    slug: textFormValue(formData, "slug"),
    category: textFormValue(formData, "category"),
    client_name: textFormValue(formData, "client_name"),
    project_id: textFormValue(formData, "project_id"),
    description: textFormValue(formData, "description"),
    problem_solved: textFormValue(formData, "problem_solved"),
    motivation: textFormValue(formData, "motivation"),
    external_link: textFormValue(formData, "external_link"),
    tech_stack: textFormValue(formData, "tech_stack"),
    is_founder_project: checkboxFormValue(formData, "is_founder_project"),
    display_order: textFormValue(formData, "display_order"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      error: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const result = await createCase(supabase, parsed.data)

  if (!result.ok) {
    return { status: "error", error: ERROR_MESSAGES[result.error] }
  }

  return { status: "success", id: result.id }
}

export type UpdateCaseState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success" }
  | undefined

export async function updateCaseAction(
  _prevState: UpdateCaseState,
  formData: FormData
): Promise<UpdateCaseState> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { status: "error", error: auth.error }

  const parsed = updateCaseSchema.safeParse({
    case_id: textFormValue(formData, "case_id"),
    title: textFormValue(formData, "title"),
    slug: textFormValue(formData, "slug"),
    category: textFormValue(formData, "category"),
    client_name: textFormValue(formData, "client_name"),
    project_id: textFormValue(formData, "project_id"),
    description: textFormValue(formData, "description"),
    problem_solved: textFormValue(formData, "problem_solved"),
    motivation: textFormValue(formData, "motivation"),
    external_link: textFormValue(formData, "external_link"),
    tech_stack: textFormValue(formData, "tech_stack"),
    is_founder_project: checkboxFormValue(formData, "is_founder_project"),
    published: checkboxFormValue(formData, "published"),
    display_order: textFormValue(formData, "display_order"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      error: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const result = await updateCase(supabase, parsed.data)

  if (!result.ok) {
    return { status: "error", error: ERROR_MESSAGES[result.error] }
  }

  return { status: "success" }
}
