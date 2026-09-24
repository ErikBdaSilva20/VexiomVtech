import { z } from "zod"

import { MAX_LONG_TEXT } from "@/lib/leads/lead-schema"

/**
 * `mudanca_status` is excluded on purpose: that type is only ever written
 * by the `trg_leads_log_status_change` DB trigger (supabase/setup.sql), an
 * admin never creates one directly through this schema.
 */
export const creatableLeadInteractionTypeSchema = z.enum([
  "nota",
  "mensagem_enviada",
  "mensagem_recebida",
])

export type CreatableLeadInteractionType = z.infer<typeof creatableLeadInteractionTypeSchema>

/**
 * Input for registering a timeline entry (FR10). `occurred_at` is optional
 * — omitted means "now"; when provided it lets an admin log a retroactive
 * entry (FR9 AC1: "data/hora... editável para retroativo").
 */
export const createLeadInteractionSchema = z.object({
  lead_id: z.uuid("Lead inválido."),
  type: creatableLeadInteractionTypeSchema,
  content: z.string().trim().min(1, "Conteúdo é obrigatório.").max(MAX_LONG_TEXT),
  occurred_at: z.iso.datetime({ offset: true }).nullish(),
})

export type CreateLeadInteractionInput = z.infer<typeof createLeadInteractionSchema>
