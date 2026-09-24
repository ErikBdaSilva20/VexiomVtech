"use server"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { findDuplicateLeadId } from "@/lib/leads/duplicate-detection"
import { manualLeadSchema } from "@/lib/leads/lead-schema"
import { createClient } from "@/lib/supabase/server"

export type CreateManualLeadState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; id: string }
  | undefined

const FIELDS = [
  "name",
  "company",
  "email",
  "whatsapp",
  "project_type",
  "description",
  "desired_deadline",
  "budget_range",
  "preferred_channel",
  "preferred_time",
  "source",
] as const

/**
 * Admin manual lead-entry Server Action (story 2.3). No destination page
 * exists yet (backend only, by explicit user decision) — this is wired up
 * once `/painel-8f2k/leads/novo` gets a form.
 *
 * Uses the session-aware client (`createClient()`), not the service-role
 * client: the caller is an authenticated admin, so RLS
 * (`leads_insert_admins`) is the intended enforcement layer here, unlike the
 * public `/api/leads` path which has no anon insert policy at all.
 */
export async function createManualLead(
  _prevState: CreateManualLeadState,
  formData: FormData
): Promise<CreateManualLeadState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const raw: Record<string, unknown> = {}
  for (const field of FIELDS) {
    const value = formData.get(field)
    if (typeof value === "string") {
      raw[field] = value
    }
  }

  const parsed = manualLeadSchema.safeParse(raw)

  if (!parsed.success) {
    return {
      status: "error",
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()

    const possibleDuplicateOf = await findDuplicateLeadId(supabase, {
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp,
    })

    const { data, error } = await supabase
      .from("leads")
      .insert({
        ...parsed.data,
        possible_duplicate_of: possibleDuplicateOf,
        created_by: admin.id,
      })
      .select("id")
      .single()

    if (error) {
      console.error("createManualLead: failed to insert lead", error)
      return { status: "error", error: "Não foi possível registrar o lead. Tente novamente." }
    }

    return { status: "success", id: data.id }
  } catch (error) {
    console.error("createManualLead: unexpected failure", error)
    return { status: "error", error: "Não foi possível registrar o lead. Tente novamente." }
  }
}
