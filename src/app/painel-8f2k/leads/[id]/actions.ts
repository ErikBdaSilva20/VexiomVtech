"use server"

import { z } from "zod"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import type { LeadStatus } from "@/lib/leads/lead-status"
import { createLeadInteractionSchema } from "@/lib/leads/lead-interaction-schema"
import { updateLeadStatusSchema } from "@/lib/leads/update-lead-status-schema"
import { createClient } from "@/lib/supabase/server"

// Supabase's "no rows found" error code for `.single()` — same constant as
// src/lib/auth/get-current-admin.ts, kept local here since it's a
// PostgREST-wide code, not something specific to leads.
const NO_ROWS_ERROR_CODE = "PGRST116"

export type CreateLeadInteractionState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; id: string }
  | undefined

export type MarkLeadRespondedState =
  | { status: "error"; error: string }
  | { status: "success" }
  | undefined

export type UpdateLeadStatusState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "conflict"; currentStatus: LeadStatus }
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

/**
 * Changes a lead's commercial status (FR12). The DB trigger
 * `trg_leads_log_status_change` (supabase/setup.sql) automatically appends
 * the `mudanca_status` timeline entry (FR13) — this action must never
 * insert one itself, or every status change would be logged twice.
 *
 * Optimistic concurrency: the caller must send `expected_status` (the
 * status it last displayed for this lead). The UPDATE is conditioned on
 * the DB still holding that value; if another admin changed the status in
 * the meantime, this matches 0 rows and the action reports a `conflict`
 * with the lead's actual current status instead of silently overwriting
 * the other admin's change.
 */
export async function updateLeadStatus(
  _prevState: UpdateLeadStatusState,
  formData: FormData
): Promise<UpdateLeadStatusState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const parsed = updateLeadStatusSchema.safeParse({
    lead_id: formData.get("lead_id"),
    status: formData.get("status"),
    expected_status: formData.get("expected_status"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      error: "Dados inválidos.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("leads")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.lead_id)
      .eq("status", parsed.data.expected_status)
      .select("id")
      .single()

    if (data) {
      return { status: "success" }
    }

    if (error && error.code !== NO_ROWS_ERROR_CODE) {
      console.error("updateLeadStatus: failed to update lead", error)
      return { status: "error", error: "Não foi possível alterar o status. Tente novamente." }
    }

    // 0 rows matched: either the lead doesn't exist, or its status no
    // longer matches expected_status (someone else changed it first).
    // Re-read to tell those two cases apart and give the caller a status
    // it can act on instead of a generic failure.
    const { data: currentLead, error: currentLeadError } = await supabase
      .from("leads")
      .select("status")
      .eq("id", parsed.data.lead_id)
      .maybeSingle()

    if (currentLeadError || !currentLead) {
      console.error(
        "updateLeadStatus: lead not found after a conditional update matched 0 rows",
        currentLeadError
      )
      return { status: "error", error: "Não foi possível alterar o status. Tente novamente." }
    }

    return { status: "conflict", currentStatus: currentLead.status as LeadStatus }
  } catch (error) {
    console.error("updateLeadStatus: unexpected failure", error)
    return { status: "error", error: "Não foi possível alterar o status. Tente novamente." }
  }
}
