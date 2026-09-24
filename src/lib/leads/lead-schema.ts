import { z } from "zod"

// Upper bound on any single field, chosen to absorb a legitimate free-text
// answer while rejecting a multi-MB payload — the request body itself has
// no size cap otherwise, since Next.js Route Handlers don't impose one.
const MAX_SHORT_TEXT = 200
const MAX_LONG_TEXT = 5000

// Optional lead fields are free text from the public form (no closed
// taxonomy documented for project_type/budget_range/etc. at the DB level —
// see supabase/setup.sql), so an empty string is normalized to `null`
// instead of being stored as a meaningless blank value.
function optionalText(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength, `Deve ter no máximo ${maxLength} caracteres.`)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))
}

/**
 * Shared by the public contact-form endpoint (`POST /api/leads`) and the
 * future admin manual-creation flow (story 2.3) — both create a `leads`
 * row from the same required fields.
 */
export const publicLeadSchema = z.object({
  name: z.string().trim().min(1, "Nome é obrigatório.").max(MAX_SHORT_TEXT),
  company: optionalText(MAX_SHORT_TEXT),
  email: z
    .string()
    .trim()
    .min(1, "E-mail é obrigatório.")
    .max(MAX_SHORT_TEXT)
    .email("E-mail inválido."),
  whatsapp: z.string().trim().min(1, "WhatsApp é obrigatório.").max(MAX_SHORT_TEXT),
  project_type: z.string().trim().min(1, "Tipo de projeto é obrigatório.").max(MAX_SHORT_TEXT),
  description: z.string().trim().min(1, "Descrição é obrigatória.").max(MAX_LONG_TEXT),
  desired_deadline: optionalText(MAX_SHORT_TEXT),
  budget_range: optionalText(MAX_SHORT_TEXT),
  preferred_channel: optionalText(MAX_SHORT_TEXT),
  preferred_time: optionalText(MAX_SHORT_TEXT),
})

export type PublicLeadInput = z.infer<typeof publicLeadSchema>
