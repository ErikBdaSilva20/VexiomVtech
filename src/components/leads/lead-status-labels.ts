import { LEAD_STATUSES } from "@/lib/leads/lead-status"

export const LEAD_STATUS_LABELS: Record<string, string> = {
  novo_lead: "Novo lead",
  em_analise: "Em análise",
  primeiro_contato_realizado: "Primeiro contato realizado",
  conversa_agendada: "Conversa agendada",
  proposta_em_preparacao: "Proposta em preparação",
  proposta_enviada: "Proposta enviada",
  follow_up_pendente: "Follow-up pendente",
  contrato_fechado: "Contrato fechado",
  nao_convertido: "Não convertido",
  em_suporte_continuo: "Em suporte contínuo",
}

export const LEAD_STATUS_OPTIONS = LEAD_STATUSES.map((status) => ({
  value: status,
  label: LEAD_STATUS_LABELS[status],
}))
