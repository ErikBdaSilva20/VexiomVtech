import { z } from "zod"

import { MAX_LONG_TEXT, MAX_SHORT_TEXT, optionalText } from "@/lib/leads/lead-schema"

const MAX_TAG_LENGTH = 50
const MAX_TAGS = 20

/**
 * FR14: next_action (free text) + next_action_at (when). Both nullable so
 * either can be explicitly cleared once set.
 */
export const updateLeadNextActionSchema = z.object({
  lead_id: z.uuid("Lead inválido."),
  next_action: optionalText(MAX_SHORT_TEXT),
  next_action_at: z.iso.datetime({ offset: true }).nullable(),
})

/** FR15: probability is one of the three values already enforced by the DB check constraint. */
export const updateLeadProbabilitySchema = z.object({
  lead_id: z.uuid("Lead inválido."),
  probability: z.enum(["baixa", "media", "alta"]).nullable(),
})

/**
 * FR16: tags are free text, but each individual tag is still bounded and
 * non-empty — an admin typing an empty tag or a huge one shouldn't produce
 * a malformed array. Full-array replace semantics (not incremental
 * add/remove): the caller sends the complete desired tag list.
 */
export const updateLeadTagsSchema = z.object({
  lead_id: z.uuid("Lead inválido."),
  tags: z
    .array(z.string().trim().min(1).max(MAX_TAG_LENGTH))
    .max(MAX_TAGS, `No máximo ${MAX_TAGS} tags.`),
})

/**
 * FR17: no backend rule ties this to `status === 'nao_convertido'` — the AC
 * only requires the *field* to become available in the UI at that point,
 * which is a frontend concern. Tying this to the current status at the DB
 * or action layer would also create a cross-cutting dependency on story
 * 2.7's `updateLeadStatus`, out of scope here.
 */
export const updateLeadNonConversionReasonSchema = z.object({
  lead_id: z.uuid("Lead inválido."),
  non_conversion_reason: optionalText(MAX_LONG_TEXT),
})

/**
 * FR18: `expected_assigned_to` is required (may be `null`, meaning "was
 * unassigned") so a race between two admins both trying to claim the same
 * unassigned lead is caught explicitly, same optimistic-concurrency posture
 * as story 2.7's status change — this one is a real scenario worth
 * guarding, unlike e.g. tags/probability, which are plain metadata with no
 * "two people claiming the same thing" risk.
 */
export const updateLeadAssigneeSchema = z.object({
  lead_id: z.uuid("Lead inválido."),
  assigned_to: z.uuid("Responsável inválido.").nullable(),
  expected_assigned_to: z.uuid("Responsável inválido.").nullable(),
})
