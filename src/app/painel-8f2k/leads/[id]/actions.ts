"use server"

import { z } from "zod"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createLeadInteractionSchema } from "@/lib/leads/lead-interaction-schema"
import { createClient } from "@/lib/supabase/server"

export type CreateLeadInteractionState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; id: string }
  | undefined

export type MarkLeadRespondedState =
  | { status: "error"; error: string }
  | { status: "success" }
  | undefined

/**
 * Registers a timeline entry for a lead (FR10). No `/painel-8f2k/leads/[id]`
 * page exists yet (backend only, same boundary as stories 2.1-2.4) — this is
 * wired up once the lead detail page is built.
 *
 * `author_id` is never trusted from the client: a "mensagem_recebida" is
 * never attributed to an admin (FR9 AC3 — the customer has no account in
 * the system), and any other type is always attributed to the caller.
 */
export async function createLeadInteraction(
  _prevState: CreateLeadInteractionState,
  formData: FormData
): Promise<CreateLeadInteractionState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const rawOccurredAt = formData.get("occurred_at")

  const parsed = createLeadInteractionSchema.safeParse({
    lead_id: formData.get("lead_id"),
    type: formData.get("type"),
    content: formData.get("content"),
    occurred_at: typeof rawOccurredAt === "string" && rawOccurredAt.length > 0 ? rawOccurredAt : null,
  })

  if (!parsed.success) {
    return {
      status: "error",
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const authorId = parsed.data.type === "mensagem_recebida" ? null : admin.id

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("lead_interactions")
      .insert({
        lead_id: parsed.data.lead_id,
        type: parsed.data.type,
        content: parsed.data.content,
        occurred_at: parsed.data.occurred_at ?? new Date().toISOString(),
        author_id: authorId,
      })
      .select("id")
      .single()

    if (error) {
      console.error("createLeadInteraction: failed to insert interaction", error)
      return { status: "error", error: "Não foi possível registrar a interação. Tente novamente." }
    }

    return { status: "success", id: data.id }
  } catch (error) {
    console.error("createLeadInteraction: unexpected failure", error)
    return { status: "error", error: "Não foi possível registrar a interação. Tente novamente." }
  }
}

/**
 * Manually marks a lead as responded (FR11 AC3). Unlike `markLeadViewed`,
 * `responded_at` is deliberately overwritten on every call: the ACs only
 * require `viewed_at` to keep its first value, and this is an explicit,
 * one-off admin action (not a passive side effect of opening the page), so
 * each click reflects "responded as of now", not "responded for the first
 * time ever".
 */
export async function markLeadResponded(
  _prevState: MarkLeadRespondedState,
  formData: FormData
): Promise<MarkLeadRespondedState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const parsedLeadId = z.uuid().safeParse(formData.get("lead_id"))

  if (!parsedLeadId.success) {
    return { status: "error", error: "Lead inválido." }
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("leads")
      .update({ responded_at: new Date().toISOString() })
      .eq("id", parsedLeadId.data)
      .select("id")
      .single()

    if (error || !data) {
      console.error("markLeadResponded: failed to update lead", error)
      return { status: "error", error: "Não foi possível marcar o lead como respondido. Tente novamente." }
    }

    return { status: "success" }
  } catch (error) {
    console.error("markLeadResponded: unexpected failure", error)
    return { status: "error", error: "Não foi possível marcar o lead como respondido. Tente novamente." }
  }
}
