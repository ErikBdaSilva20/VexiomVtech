"use server"

import { z } from "zod"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import type { LeadStatus } from "@/lib/leads/lead-status"
import { createLeadInteractionSchema } from "@/lib/leads/lead-interaction-schema"
import { createLeadMeetingSchema, updateLeadMeetingStatusSchema } from "@/lib/leads/lead-meeting-schema"
import {
  updateLeadAssigneeSchema,
  updateLeadNextActionSchema,
  updateLeadNonConversionReasonSchema,
  updateLeadProbabilitySchema,
  updateLeadTagsSchema,
} from "@/lib/leads/lead-qualification-schema"
import { updateLeadFields } from "@/lib/leads/update-lead-fields"
import { updateLeadStatusSchema } from "@/lib/leads/update-lead-status-schema"
import { createClient } from "@/lib/supabase/server"
import type { LeadMeetingStatus } from "@/lib/supabase/database.types"

// Supabase's "no rows found" error code for `.single()` — same constant as
// src/lib/auth/get-current-admin.ts, kept local here since it's a
// PostgREST-wide code, not something specific to leads.
const NO_ROWS_ERROR_CODE = "PGRST116"

// A `FormData` field that's absent from the form entirely arrives as
// `null` (the caller isn't touching that field); one that's present but
// empty (e.g. a cleared input) arrives as `""`, which schemas here treat as
// an explicit "clear this value" rather than a validation error.
function nullableFormValue(formData: FormData, key: string): string | null {
  const value = formData.get(key)
  return typeof value === "string" && value.length > 0 ? value : null
}

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

export type UpdateLeadNextActionState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success" }
  | undefined

export type UpdateLeadProbabilityState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success" }
  | undefined

export type UpdateLeadTagsState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success" }
  | undefined

export type UpdateLeadNonConversionReasonState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success" }
  | undefined

export type UpdateLeadAssigneeState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "conflict"; currentAssignedTo: string | null }
  | { status: "success" }
  | undefined

export type CreateLeadMeetingState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; id: string }
  | undefined

export type UpdateLeadMeetingStatusState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "conflict"; currentStatus: LeadMeetingStatus }
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

  const parsed = createLeadInteractionSchema.safeParse({
    lead_id: formData.get("lead_id"),
    type: formData.get("type"),
    content: formData.get("content"),
    occurred_at: nullableFormValue(formData, "occurred_at"),
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

/**
 * Sets next_action + next_action_at together (FR14). Both are nullable so
 * either can be explicitly cleared (empty string) without touching the
 * other.
 */
export async function updateLeadNextAction(
  _prevState: UpdateLeadNextActionState,
  formData: FormData
): Promise<UpdateLeadNextActionState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const parsed = updateLeadNextActionSchema.safeParse({
    lead_id: formData.get("lead_id"),
    next_action: nullableFormValue(formData, "next_action"),
    next_action_at: nullableFormValue(formData, "next_action_at"),
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
    const result = await updateLeadFields(supabase, parsed.data.lead_id, {
      next_action: parsed.data.next_action,
      next_action_at: parsed.data.next_action_at,
    })

    if (!result.ok) {
      console.error("updateLeadNextAction: failed to update lead", result.error)
      return { status: "error", error: "Não foi possível salvar a próxima ação. Tente novamente." }
    }

    return { status: "success" }
  } catch (error) {
    console.error("updateLeadNextAction: unexpected failure", error)
    return { status: "error", error: "Não foi possível salvar a próxima ação. Tente novamente." }
  }
}

/** Sets the lead's closing probability (FR15). */
export async function updateLeadProbability(
  _prevState: UpdateLeadProbabilityState,
  formData: FormData
): Promise<UpdateLeadProbabilityState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const parsed = updateLeadProbabilitySchema.safeParse({
    lead_id: formData.get("lead_id"),
    probability: nullableFormValue(formData, "probability"),
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
    const result = await updateLeadFields(supabase, parsed.data.lead_id, {
      probability: parsed.data.probability,
    })

    if (!result.ok) {
      console.error("updateLeadProbability: failed to update lead", result.error)
      return { status: "error", error: "Não foi possível salvar a probabilidade. Tente novamente." }
    }

    return { status: "success" }
  } catch (error) {
    console.error("updateLeadProbability: unexpected failure", error)
    return { status: "error", error: "Não foi possível salvar a probabilidade. Tente novamente." }
  }
}

/**
 * Replaces a lead's full tag list (FR16). Full-array replace, not
 * incremental add/remove — the caller sends the complete desired list.
 */
export async function updateLeadTags(
  _prevState: UpdateLeadTagsState,
  formData: FormData
): Promise<UpdateLeadTagsState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const parsed = updateLeadTagsSchema.safeParse({
    lead_id: formData.get("lead_id"),
    tags: formData.getAll("tags"),
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
    const result = await updateLeadFields(supabase, parsed.data.lead_id, {
      tags: parsed.data.tags,
    })

    if (!result.ok) {
      console.error("updateLeadTags: failed to update lead", result.error)
      return { status: "error", error: "Não foi possível salvar as tags. Tente novamente." }
    }

    return { status: "success" }
  } catch (error) {
    console.error("updateLeadTags: unexpected failure", error)
    return { status: "error", error: "Não foi possível salvar as tags. Tente novamente." }
  }
}

/**
 * Sets the non-conversion reason (FR17). No backend rule requires
 * `status === 'nao_convertido'` first — see `updateLeadNonConversionReasonSchema`'s
 * doc comment for why that's deliberately left as a frontend concern.
 */
export async function updateLeadNonConversionReason(
  _prevState: UpdateLeadNonConversionReasonState,
  formData: FormData
): Promise<UpdateLeadNonConversionReasonState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const parsed = updateLeadNonConversionReasonSchema.safeParse({
    lead_id: formData.get("lead_id"),
    non_conversion_reason: nullableFormValue(formData, "non_conversion_reason"),
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
    const result = await updateLeadFields(supabase, parsed.data.lead_id, {
      non_conversion_reason: parsed.data.non_conversion_reason,
    })

    if (!result.ok) {
      console.error("updateLeadNonConversionReason: failed to update lead", result.error)
      return { status: "error", error: "Não foi possível salvar o motivo. Tente novamente." }
    }

    return { status: "success" }
  } catch (error) {
    console.error("updateLeadNonConversionReason: unexpected failure", error)
    return { status: "error", error: "Não foi possível salvar o motivo. Tente novamente." }
  }
}

/**
 * Assigns a lead to an admin, or unassigns it (`assigned_to: null`) (FR18).
 *
 * Optimistic concurrency, same posture as `updateLeadStatus` (story 2.7):
 * the caller sends `expected_assigned_to` (who/what it last saw as the
 * owner) and the UPDATE is conditioned on it — two admins racing to claim
 * the same unassigned lead is a real scenario, not a hypothetical, so the
 * loser gets an explicit `conflict` (with who actually holds it now)
 * instead of silently stealing the assignment back.
 */
export async function updateLeadAssignee(
  _prevState: UpdateLeadAssigneeState,
  formData: FormData
): Promise<UpdateLeadAssigneeState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const parsed = updateLeadAssigneeSchema.safeParse({
    lead_id: formData.get("lead_id"),
    assigned_to: nullableFormValue(formData, "assigned_to"),
    expected_assigned_to: nullableFormValue(formData, "expected_assigned_to"),
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

    let query = supabase
      .from("leads")
      .update({ assigned_to: parsed.data.assigned_to })
      .eq("id", parsed.data.lead_id)

    query =
      parsed.data.expected_assigned_to === null
        ? query.is("assigned_to", null)
        : query.eq("assigned_to", parsed.data.expected_assigned_to)

    const { data, error } = await query.select("id").single()

    if (data) {
      return { status: "success" }
    }

    if (error && error.code !== NO_ROWS_ERROR_CODE) {
      console.error("updateLeadAssignee: failed to update lead", error)
      return { status: "error", error: "Não foi possível salvar o responsável. Tente novamente." }
    }

    const { data: currentLead, error: currentLeadError } = await supabase
      .from("leads")
      .select("assigned_to")
      .eq("id", parsed.data.lead_id)
      .maybeSingle()

    if (currentLeadError || !currentLead) {
      console.error(
        "updateLeadAssignee: lead not found after a conditional update matched 0 rows",
        currentLeadError
      )
      return { status: "error", error: "Não foi possível salvar o responsável. Tente novamente." }
    }

    return { status: "conflict", currentAssignedTo: currentLead.assigned_to }
  } catch (error) {
    console.error("updateLeadAssignee: unexpected failure", error)
    return { status: "error", error: "Não foi possível salvar o responsável. Tente novamente." }
  }
}

/**
 * Schedules a meeting for a lead (FR19). `status` is never accepted from
 * the client — `lead_meetings.status` defaults to `'agendada'` at the DB
 * level, so this insert leaves it unset.
 */
export async function createLeadMeeting(
  _prevState: CreateLeadMeetingState,
  formData: FormData
): Promise<CreateLeadMeetingState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const parsed = createLeadMeetingSchema.safeParse({
    lead_id: formData.get("lead_id"),
    scheduled_at: formData.get("scheduled_at"),
    notes: nullableFormValue(formData, "notes"),
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
      .from("lead_meetings")
      .insert({
        lead_id: parsed.data.lead_id,
        scheduled_at: parsed.data.scheduled_at,
        notes: parsed.data.notes,
      })
      .select("id")
      .single()

    if (error) {
      console.error("createLeadMeeting: failed to insert meeting", error)
      return { status: "error", error: "Não foi possível agendar a reunião. Tente novamente." }
    }

    return { status: "success", id: data.id }
  } catch (error) {
    console.error("createLeadMeeting: unexpected failure", error)
    return { status: "error", error: "Não foi possível agendar a reunião. Tente novamente." }
  }
}

/**
 * Marks a meeting as realizada/cancelada (FR19), never back to agendada —
 * the schema restricts the target `status` accordingly.
 *
 * Optimistic concurrency, same posture as `updateLeadStatus`/
 * `updateLeadAssignee`: two admins acting on the same meeting at once (one
 * marking it done, another cancelling it) is a real scenario, so the
 * caller sends `expected_status` and a mismatch surfaces as an explicit
 * `conflict` instead of a silent overwrite.
 */
export async function updateLeadMeetingStatus(
  _prevState: UpdateLeadMeetingStatusState,
  formData: FormData
): Promise<UpdateLeadMeetingStatusState> {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return { status: "error", error: "Sessão expirada. Faça login novamente." }
  }

  const parsed = updateLeadMeetingStatusSchema.safeParse({
    meeting_id: formData.get("meeting_id"),
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
      .from("lead_meetings")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.meeting_id)
      .eq("status", parsed.data.expected_status)
      .select("id")
      .single()

    if (data) {
      return { status: "success" }
    }

    if (error && error.code !== NO_ROWS_ERROR_CODE) {
      console.error("updateLeadMeetingStatus: failed to update meeting", error)
      return { status: "error", error: "Não foi possível atualizar a reunião. Tente novamente." }
    }

    const { data: currentMeeting, error: currentMeetingError } = await supabase
      .from("lead_meetings")
      .select("status")
      .eq("id", parsed.data.meeting_id)
      .maybeSingle()

    if (currentMeetingError || !currentMeeting) {
      console.error(
        "updateLeadMeetingStatus: meeting not found after a conditional update matched 0 rows",
        currentMeetingError
      )
      return { status: "error", error: "Não foi possível atualizar a reunião. Tente novamente." }
    }

    return { status: "conflict", currentStatus: currentMeeting.status }
  } catch (error) {
    console.error("updateLeadMeetingStatus: unexpected failure", error)
    return { status: "error", error: "Não foi possível atualizar a reunião. Tente novamente." }
  }
}
