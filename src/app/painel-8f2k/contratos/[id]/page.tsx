import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import type { ReactNode } from "react"

import { AdminNav } from "@/components/admin/admin-nav"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { listLeadInteractions } from "@/lib/leads/list-lead-interactions"
import { listLeadMeetings } from "@/lib/leads/list-lead-meetings"
import { getContractDetails } from "@/lib/contracts/get-contract-details"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Detalhes do contrato - Vexiom",
  robots: { index: false, follow: false },
}

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" })
const SERVICE_TYPE_LABELS: Record<string, string> = { site: "Site", sistema_sob_medida: "Sistema sob medida", aplicativo: "Aplicativo", manutencao: "Manutenção", consultoria: "Consultoria", demanda: "Demanda (por hora)" }
const LEAD_STATUS_LABELS: Record<string, string> = { novo_lead: "Novo lead", em_analise: "Em análise", primeiro_contato: "1º contato", agendado: "Agendado", preparando_proposta: "Preparando proposta", proposta_enviada: "Proposta enviada", contrato_fechado: "Contrato fechado", nao_convertido: "Não convertido", em_suporte_continuo: "Suporte contínuo" }
const INTERACTION_LABELS: Record<string, string> = { nota: "Nota interna", mensagem_enviada: "Mensagem enviada", mensagem_recebida: "Mensagem recebida", mudanca_status: "Mudança de status" }
const MEETING_LABELS: Record<string, string> = { agendada: "Agendada", realizada: "Realizada", cancelada: "Cancelada" }

function formatDate(value: string | null) {
  return value ? dateFormatter.format(new Date(value)) : "Não informado"
}

function Detail({ label, value, children }: { label: string; value?: string | null; children?: ReactNode }) {
  return <div className="min-w-0"><dt className="text-xs font-medium uppercase tracking-wide text-[#85867f]">{label}</dt><dd className="mt-1 break-words text-sm text-[#e5e5df]">{children ?? value ?? "Não informado"}</dd></div>
}

function Section({ title, eyebrow, children }: { title: string; eyebrow?: string; children: ReactNode }) {
  return <section className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">{eyebrow && <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">{eyebrow}</p>}<h2 className={(eyebrow ? "mt-2 " : "") + "text-lg font-semibold text-white"}>{title}</h2>{children}</section>
}

export default async function ContractDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()
  const supabase = await createClient()
  const details = await getContractDetails(supabase, id)
  if (!details) notFound()

  const { contract, lead, accesses } = details
  const [interactions, meetings] = lead ? await Promise.all([listLeadInteractions(supabase, lead.id), listLeadMeetings(supabase, lead.id)]) : [[], []]

  return <main className="min-h-screen overflow-x-hidden bg-[#0c0e0c] px-4 py-5 text-[#f1f1ed] sm:px-6 sm:py-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-7xl">
    <AdminNav role={admin.role} active="contracts" />
    <Link href="/painel-8f2k/contratos" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]"><span aria-hidden="true">←</span> Voltar aos contratos</Link>

    <header className="mb-7 mt-6 flex flex-col gap-5 sm:mt-8 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Contrato fechado</p><h1 className="break-words text-2xl font-semibold tracking-tight text-white sm:text-4xl">{lead?.name ?? "Lead removido"}</h1><p className="mt-2 text-sm text-[#aaa]">{lead?.company ?? "Sem empresa informada"} · registrado em {formatDate(contract.created_at)}</p></div><div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row"> <Link href={`/painel-8f2k/contratos/${contract.id}/editar`} className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-[#6c6230] px-5 text-sm font-semibold text-[#fbd020] hover:border-[#fbd020] sm:w-auto">Editar contrato</Link>{contract.file_object_path && <a href={`/painel-8f2k/contratos/${contract.id}/download`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510] hover:bg-[#ffe45d] sm:w-auto"><span aria-hidden="true">↓</span> Baixar PDF</a>}</div></header>

    <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-xl border border-[#6c6230] bg-[#211f15] p-4 sm:p-5"><p className="text-xs uppercase tracking-wide text-[#c5b74b]">Valor contratado</p><p className="mt-2 text-2xl font-semibold text-[#fbd020]">{money.format(contract.amount)}</p></div><div className="rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-5"><p className="text-xs uppercase tracking-wide text-[#85867f]">Escopo</p><p className="mt-2 text-lg font-semibold text-white">{contract.service_types.length} {contract.service_types.length === 1 ? "serviço" : "serviços"}</p><p className="mt-1 text-xs text-[#aaa]">{contract.hours != null ? `${contract.hours} horas estimadas` : "Sem estimativa de horas"}</p></div><div className="rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-5"><p className="text-xs uppercase tracking-wide text-[#85867f]">Documento</p><p className="mt-2 text-lg font-semibold text-white">{contract.file_object_path ? "PDF anexado" : "Sem anexo"}</p><p className="mt-1 text-xs text-[#aaa]">{contract.file_object_path ? "Arquivo protegido e disponível" : "Nenhum arquivo foi enviado"}</p></div><div className="rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-5"><p className="text-xs uppercase tracking-wide text-[#85867f]">ID do contrato</p><p className="mt-2 break-all font-mono text-sm text-[#e5e5df]">{contract.id}</p><p className="mt-1 text-xs text-[#aaa]">Criado por {details.creator_name ?? "admin não identificado"}</p></div></div>

    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]"><div className="space-y-6">
      <Section title="O que foi contratado" eyebrow="Resumo comercial"><dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2"><Detail label="Serviços"><div className="flex flex-wrap gap-2">{contract.service_types.map((type) => <span key={type} className="rounded-full border border-[#57513a] bg-[#29271e] px-2.5 py-1 text-xs text-[#fbd020]">{SERVICE_TYPE_LABELS[type] ?? type}</span>)}</div></Detail><Detail label="Valor total" value={money.format(contract.amount)} /><Detail label="Horas previstas" value={contract.hours != null ? `${contract.hours}h` : "Não se aplica / não informado"} /><Detail label="Registrado em" value={formatDate(contract.created_at)} /><Detail label="Registrado por" value={details.creator_name ?? "Admin não identificado"} /><Detail label="Documento"><span className={contract.file_object_path ? "text-emerald-300" : "text-[#aaa]"}>{contract.file_object_path ? "PDF assinado anexado" : "Sem PDF anexado"}</span></Detail></dl></Section>

      <Section title="Contexto do cliente" eyebrow="Lead relacionado">{lead ? <><dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2"><Detail label="Nome" value={lead.name} /><Detail label="Empresa" value={lead.company} /><Detail label="E-mail"><a className="break-all hover:text-[#fbd020] hover:underline" href={`mailto:${lead.email}`}>{lead.email}</a></Detail><Detail label="WhatsApp"><a className="hover:text-[#fbd020] hover:underline" href={`tel:${lead.whatsapp}`}>{lead.whatsapp}</a></Detail><Detail label="Tipo de projeto" value={lead.project_type} /><Detail label="Origem" value={lead.source} /><Detail label="Prazo desejado" value={lead.desired_deadline} /><Detail label="Faixa de investimento" value={lead.budget_range} /><Detail label="Canal preferido" value={lead.preferred_channel} /><Detail label="Melhor horário" value={lead.preferred_time} /></dl><div className="mt-6 border-t border-[#292b28] pt-5"><h3 className="text-sm font-semibold text-white">Descrição original</h3><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#b9bab4]">{lead.description}</p></div><Link href={`/painel-8f2k/leads/${lead.id}`} className="mt-5 inline-flex min-h-10 items-center rounded-md border border-[#3a3b37] px-4 text-sm font-semibold text-[#ddd] hover:border-[#fbd020] hover:text-[#fbd020]">Abrir ficha completa do lead <span aria-hidden="true" className="ml-2">→</span></Link></> : <p className="mt-4 text-sm text-amber-200">O lead relacionado foi removido. Os dados do contrato continuam preservados.</p>}</Section>

      {lead && <Section title="Histórico do lead" eyebrow="Linha do tempo">{interactions.length ? <ol className="mt-5 space-y-0">{interactions.map((interaction) => <li key={interaction.id} className="relative border-l border-[#393a35] pb-5 pl-5 last:border-l-transparent last:pb-0"><span aria-hidden="true" className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-[#fbd020]" /><div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="text-sm font-medium text-[#eee]">{INTERACTION_LABELS[interaction.type] ?? interaction.type}</h3><time className="text-xs text-[#85867f]" dateTime={interaction.occurred_at}>{formatDate(interaction.occurred_at)}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#b9bab4]">{interaction.content}</p></li>)}</ol> : <p className="mt-4 text-sm text-[#999]">Nenhuma interação registrada.</p>}</Section>}
      {lead && <Section title="Reuniões" eyebrow="Agenda comercial">{meetings.length ? <ul className="mt-4 divide-y divide-[#292b28]">{meetings.map((meeting) => <li key={meeting.id} className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"><div><time className="text-sm text-[#e5e5df]" dateTime={meeting.scheduled_at}>{formatDate(meeting.scheduled_at)}</time>{meeting.notes && <p className="mt-1 text-xs text-[#999]">{meeting.notes}</p>}</div><span className="w-fit rounded-full border border-[#3a3b37] px-2.5 py-1 text-xs text-[#aaa]">{MEETING_LABELS[meeting.status] ?? meeting.status}</span></li>)}</ul> : <p className="mt-4 text-sm text-[#999]">Nenhuma reunião registrada.</p>}</Section>}
    </div><aside className="space-y-6">
      {lead && <Section title="Situação no funil" eyebrow="Leitura rápida"><dl className="mt-5 space-y-4 text-sm"><Detail label="Status"><span className="inline-flex rounded-full border border-[#57513a] bg-[#29271e] px-2.5 py-1 text-[#fbd020]">{LEAD_STATUS_LABELS[lead.status] ?? lead.status}</span></Detail><Detail label="Probabilidade" value={lead.probability ? lead.probability[0].toUpperCase() + lead.probability.slice(1) : null} /><Detail label="Próxima ação" value={lead.next_action} /><Detail label="Data da próxima ação" value={formatDate(lead.next_action_at)} /><Detail label="Última interação" value={formatDate(lead.last_interaction_at)} /><Detail label="Lead recebido em" value={formatDate(lead.created_at)} /><Detail label="Visualizado em" value={formatDate(lead.viewed_at)} /><Detail label="Respondido em" value={formatDate(lead.responded_at)} /><Detail label="Responsável" value={lead.assigned_to ?? "Não atribuído"} /><Detail label="Criado por" value={lead.created_by ?? "Origem pública"} /></dl>{(lead.non_conversion_reason || lead.possible_duplicate_of) && <div className="mt-5 space-y-3 border-t border-[#292b28] pt-4">{lead.non_conversion_reason && <div><p className="text-xs font-medium uppercase tracking-wide text-[#85867f]">Motivo de não conversão</p><p className="mt-1 text-sm text-[#e5e5df]">{lead.non_conversion_reason}</p></div>}{lead.possible_duplicate_of && <div><p className="text-xs font-medium uppercase tracking-wide text-[#85867f]">Possível duplicidade</p><p className="mt-1 break-all font-mono text-xs text-amber-200">{lead.possible_duplicate_of}</p></div>}</div>}{lead.tags?.length ? <div className="mt-5 border-t border-[#292b28] pt-4"><p className="text-xs font-medium uppercase tracking-wide text-[#85867f]">Tags</p><div className="mt-2 flex flex-wrap gap-2">{lead.tags.map((tag) => <span key={tag} className="rounded-full bg-[#252724] px-2.5 py-1 text-xs text-[#c7c7c0]">{tag}</span>)}</div></div> : null}</Section>}
      <Section title="Auditoria do documento" eyebrow="Acessos ao PDF">{contract.file_object_path ? accesses.length ? <ol className="mt-5 space-y-4">{accesses.map((access) => <li key={access.id} className="flex items-start justify-between gap-3 border-b border-[#292b28] pb-4 last:border-0 last:pb-0"><div><p className="text-sm text-[#ddd]">{access.admin_name ?? "Admin não identificado"}</p><p className="mt-1 text-xs text-[#85867f]">Arquivo descriptografado para download</p></div><time className="shrink-0 text-right text-xs text-[#85867f]" dateTime={access.accessed_at}>{formatDate(access.accessed_at)}</time></li>)}</ol> : <p className="mt-4 text-sm text-[#999]">Nenhum download registrado ainda.</p> : <p className="mt-4 text-sm text-[#999]">Sem PDF anexado, portanto não há acessos para exibir.</p>}</Section>
      <div className="rounded-xl border border-[#292b28] bg-[#141513] p-5 text-sm text-[#aaa]"><p className="font-medium text-[#e5e5df]">Identificador técnico</p><p className="mt-2 break-all font-mono text-xs text-[#85867f]">{contract.id}</p><p className="mt-3 leading-6">Use este ID para localizar o registro no Supabase ou relacioná-lo a outros processos internos.</p></div>
    </aside></div>
  </div></main>
}
