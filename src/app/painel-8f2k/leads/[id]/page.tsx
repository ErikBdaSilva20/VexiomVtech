import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { LEAD_STATUS_LABELS } from "@/components/leads/lead-status-labels"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { listLeadInteractions } from "@/lib/leads/list-lead-interactions"
import { listLeadMeetings } from "@/lib/leads/list-lead-meetings"
import { markLeadViewed } from "@/lib/leads/mark-lead-viewed"
import { createClient } from "@/lib/supabase/server"

import { InteractionForm, LeadDetailControls, MeetingActions, MeetingForm } from "./lead-detail-controls"

export const metadata: Metadata = {
  title: "Detalhe do lead — Vexiom",
  robots: { index: false, follow: false },
}

const INTERACTION_LABELS: Record<string, string> = {
  nota: "Nota interna",
  mensagem_enviada: "Mensagem enviada",
  mensagem_recebida: "Mensagem recebida",
  mudanca_status: "Mudança de status",
}
const MEETING_LABELS: Record<string, string> = {
  agendada: "Agendada",
  realizada: "Realizada",
  cancelada: "Cancelada",
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")

  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()

  const supabase = await createClient()
  const { data: lead, error } = await supabase
    .from("leads")
    .select("id,created_at,name,company,email,whatsapp,project_type,description,desired_deadline,budget_range,preferred_channel,preferred_time,status,assigned_to,viewed_at,responded_at,next_action,next_action_at,probability,tags,non_conversion_reason,source,possible_duplicate_of,last_interaction_at")
    .eq("id", id)
    .maybeSingle()

  if (!lead) {
    if (error) console.error("LeadDetailPage: failed to load lead", error)
    notFound()
  }

  await markLeadViewed(supabase, lead.id)
  const [interactions, meetings] = await Promise.all([
    listLeadInteractions(supabase, lead.id),
    listLeadMeetings(supabase, lead.id),
  ])

  const terminal = ["contrato_fechado", "nao_convertido", "em_suporte_continuo"].includes(lead.status)
  const statusLabel = LEAD_STATUS_LABELS[lead.status] ?? lead.status
  const controls = {
    id: lead.id,
    status: lead.status,
    assigned_to: lead.assigned_to,
    next_action: lead.next_action,
    next_action_at: lead.next_action_at,
    probability: lead.probability,
    tags: lead.tags,
    non_conversion_reason: lead.non_conversion_reason,
    responded_at: lead.responded_at,
  }

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="leads" />
        <Link href="/painel-8f2k/leads" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]">
          <span aria-hidden="true">←</span> Voltar para leads
        </Link>
        <header className="mb-7 mt-7 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Detalhe do lead</p>
            <h1 className="break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl">{lead.name}</h1>
            {lead.company && <p className="mt-2 text-sm text-[#aaa]">{lead.company}</p>}
          </div>
          <span className="rounded-full border border-[#57513a] bg-[#29271e] px-3 py-1.5 text-sm text-[#fbd020]">{statusLabel}</span>
        </header>

        {lead.possible_duplicate_of && (
          <aside className="mb-6 rounded-lg border border-amber-900/60 bg-amber-950/25 p-4 text-sm text-amber-200">
            Possível duplicidade identificada. Confira o histórico antes de iniciar outro contato.
          </aside>
        )}

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <div className="space-y-6">
            <section className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-white">Informações do contato</h2>
              <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><dt className="text-xs text-[#85867f]">E-mail</dt><dd className="mt-1 break-all text-sm"><a className="hover:underline" href={"mailto:" + lead.email}>{lead.email}</a></dd></div>
                <div><dt className="text-xs text-[#85867f]">WhatsApp</dt><dd className="mt-1 text-sm"><a className="hover:underline" href={"tel:" + lead.whatsapp}>{lead.whatsapp}</a></dd></div>
                <div><dt className="text-xs text-[#85867f]">Tipo de projeto</dt><dd className="mt-1 text-sm">{lead.project_type}</dd></div>
                <div><dt className="text-xs text-[#85867f]">Origem</dt><dd className="mt-1 text-sm">{lead.source}</dd></div>
                <div><dt className="text-xs text-[#85867f]">Prazo desejado</dt><dd className="mt-1 text-sm">{lead.desired_deadline ?? "Não informado"}</dd></div>
                <div><dt className="text-xs text-[#85867f]">Investimento</dt><dd className="mt-1 text-sm">{lead.budget_range ?? "Não informado"}</dd></div>
                <div><dt className="text-xs text-[#85867f]">Canal preferido</dt><dd className="mt-1 text-sm">{lead.preferred_channel ?? "Não informado"}</dd></div>
                <div><dt className="text-xs text-[#85867f]">Melhor horário</dt><dd className="mt-1 text-sm">{lead.preferred_time ?? "Não informado"}</dd></div>
              </dl>
              <div className="mt-5 border-t border-[#292b28] pt-4">
                <h3 className="text-sm font-medium text-[#c7c7c0]">Descrição do pedido</h3>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#aaa]">{lead.description}</p>
              </div>
              <p className="mt-5 text-xs text-[#85867f]">Recebido em {formatDate(lead.created_at)}</p>
            </section>

            <section className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-white">Timeline</h2>
              {interactions.length ? (
                <ol className="mt-5 space-y-0">
                  {interactions.map((interaction) => (
                    <li key={interaction.id} className="relative border-l border-[#393a35] pb-6 pl-5 last:border-l-transparent last:pb-0">
                      <span aria-hidden="true" className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-[#fbd020]" />
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <h3 className="text-sm font-medium text-[#eee]">{INTERACTION_LABELS[interaction.type] ?? interaction.type}</h3>
                        <time className="text-xs text-[#85867f]" dateTime={interaction.occurred_at}>{formatDate(interaction.occurred_at)}</time>
                      </div>
                      <p className="mt-1 text-xs text-[#85867f]">
                        {interaction.type === "mensagem_recebida" ? "Cliente" : interaction.type === "mudanca_status" ? "Sistema" : interaction.author_id === admin.id ? admin.name ?? "Você" : "Equipe"}
                      </p>
                      <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-[#b9bab4]">{interaction.content}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm text-[#999]">Nenhuma interação registrada ainda.</p>
              )}
              <div className="mt-7 border-t border-[#292b28] pt-6">
                <h3 className="mb-4 text-sm font-semibold text-white">Adicionar registro</h3>
                <InteractionForm leadId={lead.id} />
              </div>
            </section>

            <section className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
              <h2 className="text-lg font-semibold text-white">Reuniões</h2>
              {meetings.length ? (
                <ul className="mt-4 divide-y divide-[#292b28]">
                  {meetings.map((meeting) => (
                    <li key={meeting.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <time className="text-sm text-[#e5e5df]" dateTime={meeting.scheduled_at}>{formatDate(meeting.scheduled_at)}</time>
                        <span className="ml-3 rounded-full border border-[#3a3b37] px-2.5 py-1 text-xs text-[#aaa]">{MEETING_LABELS[meeting.status]}</span>
                        {meeting.notes && <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-[#999]">{meeting.notes}</p>}
                      </div>
                      <MeetingActions meeting={{ id: meeting.id, status: meeting.status }} />
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-sm text-[#999]">Nenhuma reunião agendada.</p>}
              <div className="mt-6 border-t border-[#292b28] pt-6">
                <h3 className="mb-4 text-sm font-semibold text-white">Agendar reunião</h3>
                <MeetingForm leadId={lead.id} />
              </div>
            </section>
          </div>

          <aside className="space-y-5">
            <LeadDetailControls lead={controls} admin={{ id: admin.id, name: admin.name }} />
            <section className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-white">Acompanhamento</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-[#85867f]">Visualizado</dt><dd className="text-right text-[#c7c7c0]">{lead.viewed_at ? formatDate(lead.viewed_at) : "Sim, agora"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#85867f]">Respondido</dt><dd className="text-right text-[#c7c7c0]">{lead.responded_at ? formatDate(lead.responded_at) : "Ainda não"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#85867f]">Última interação</dt><dd className="text-right text-[#c7c7c0]">{lead.last_interaction_at ? formatDate(lead.last_interaction_at) : "Nenhuma"}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-[#85867f]">Funil</dt><dd className="text-right text-[#c7c7c0]">{terminal ? "Etapa encerrada" : "Em andamento"}</dd></div>
              </dl>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}

