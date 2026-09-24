import { z } from "zod"

import { leadStatusSchema } from "@/lib/leads/lead-status"

/**
 * `expected_status` is required, not optional: the caller must send the
 * status it last read for this lead so the action can detect a concurrent
 * change by another admin (optimistic concurrency) instead of blindly
 * overwriting whatever is in the DB — two admins are expected to work the
 * same lead list, so a silent last-write-wins here could quietly discard
 * someone else's more recent status change.
 */
export const updateLeadStatusSchema = z.object({
  lead_id: z.uuid("Lead inválido."),
  status: leadStatusSchema,
  expected_status: leadStatusSchema,
})

export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusSchema>
