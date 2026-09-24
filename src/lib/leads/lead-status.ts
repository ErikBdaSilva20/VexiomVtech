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

/**
 * Statuses that mean the lead is no longer being actively worked (FR13/FR20).
 * Leads in these statuses are excluded from risk alerts (3.2) — a lead
 * that already closed, was lost, or moved to support isn't "at risk".
 */
export const TERMINAL_LEAD_STATUSES = [
  "contrato_fechado",
  "nao_convertido",
  "em_suporte_continuo",
] as const satisfies readonly LeadStatus[]

export function isTerminalLeadStatus(status: LeadStatus): boolean {
  return (TERMINAL_LEAD_STATUSES as readonly LeadStatus[]).includes(status)
}
