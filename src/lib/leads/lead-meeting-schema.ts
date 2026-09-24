import { z } from "zod"

import { MAX_LONG_TEXT, optionalText } from "@/lib/leads/lead-schema"

/**
 * FR19: scheduling a meeting. `status` is never accepted from the client —
 * `lead_meetings.status` defaults to `'agendada'` at the DB level
 * (supabase/setup.sql), so the insert simply doesn't set it.
 */
export const createLeadMeetingSchema = z.object({
  lead_id: z.uuid("Lead inválido."),
  scheduled_at: z.iso.datetime({ offset: true, error: "Data/hora inválida." }),
  notes: optionalText(MAX_LONG_TEXT),
})

/**
 * The three states a meeting can be in (mirrors the DB check constraint on
 * `lead_meetings.status`), reused here so `expected_status` can represent
 * any current value.
 */
const leadMeetingStatusSchema = z.enum(["agendada", "realizada", "cancelada"])

/**
 * FR19: an admin can only move a meeting to `realizada` or `cancelada`
 * through this action — never back to `agendada`, which the AC text never
 * describes as an admin-triggerable transition.
 *
 * `expected_status` is required for the same optimistic-concurrency reason
 * as story 2.7's status change and 2.8's assignee change: two admins acting
 * on the same meeting (one marking it done, another cancelling it) at the
 * same time is a real "two people, one resource" scenario worth catching
 * explicitly instead of last-write-wins.
 */
export const updateLeadMeetingStatusSchema = z.object({
  meeting_id: z.uuid("Reunião inválida."),
  status: z.enum(["realizada", "cancelada"]),
  expected_status: leadMeetingStatusSchema,
})
