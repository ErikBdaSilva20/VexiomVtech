import { z } from "zod"

/**
 * Commercial statuses a lead can be in (FR12). Single source of truth,
 * mirrored by the DB-level `leads_status_check` constraint
 * (supabase/migrations/0003_leads_status_check_constraint.sql) — keep both
 * in sync if this list ever changes.
 */
export const LEAD_STATUSES = [
  "novo_lead",
  "em_analise",
  "primeiro_contato_realizado",
  "conversa_agendada",
  "proposta_em_preparacao",
  "proposta_enviada",
  "follow_up_pendente",
  "contrato_fechado",
  "nao_convertido",
  "em_suporte_continuo",
] as const

export type LeadStatus = (typeof LEAD_STATUSES)[number]

export const leadStatusSchema = z.enum(LEAD_STATUSES)
