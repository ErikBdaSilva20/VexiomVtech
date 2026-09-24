"use client"

import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
} from "@/components/forms/form"
import { LEAD_STATUS_OPTIONS } from "@/components/leads/lead-status-labels"

import {
  createLeadInteraction,
  createLeadMeeting,
  markLeadResponded,
  updateLeadAssignee,
  updateLeadMeetingStatus,
  updateLeadNextAction,
  updateLeadNonConversionReason,
  updateLeadProbability,
  updateLeadStatus,
  updateLeadTags,
} from "./actions"

type LeadControls = {
  id: string
  status: string
  assigned_to: string | null
  next_action: string | null
  next_action_at: string | null
  probability: "baixa" | "media" | "alta" | null
  tags: string[] | null
  non_conversion_reason: string | null
  responded_at: string | null
}
type AdminInfo = { id: string; name: string | null }
type FeedbackState = { status: string; error?: string } | undefined


function useRefreshAfterMutation(state: FeedbackState) {
  const router = useRouter()
  useEffect(() => {
    if (state?.status === "success" || state?.status === "conflict") router.refresh()
  }, [router, state])
}

function ActionFeedback({
  state,
  success,
}: {
  state: FeedbackState
  success: string
}) {
  if (state?.status === "success") {
    return <p role="status" className="text-xs text-emerald-300">{success}</p>
  }
  if (state?.status === "conflict") {
    return <p role="alert" className="text-xs text-amber-200">Este registro mudou em outra sessão. Os dados foram atualizados; confira antes de tentar novamente.</p>
  }
  if (state?.status === "error") {
    return <p role="alert" className="text-xs text-red-200">{state.error ?? "Não foi possível salvar. Tente novamente."}</p>
  }
  return null
}

function localInputValue(value: string | null) {
  if (!value) return ""
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value))
  return parts.replace(" ", "T")
}

const SAO_PAULO_OFFSET = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Sao_Paulo",
  timeZoneName: "shortOffset",
})

function saoPauloOffsetMinutes(date: Date) {
  const offset = SAO_PAULO_OFFSET.formatToParts(date).find((part) => part.type === "timeZoneName")?.value
  const match = /^GMT([+-])(\d{1,2})(?::(\d{2}))?$/.exec(offset ?? "")
  if (!match) return 0
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0)
  return match[1] === "-" ? -minutes : minutes
}

function isoFromLocal(value: string) {
  if (!value) return ""
  const wallTime = Date.parse(value + "Z")
  if (Number.isNaN(wallTime)) return ""
  const firstGuess = new Date(wallTime)
  const utcTime = wallTime - saoPauloOffsetMinutes(firstGuess) * 60_000
  const correctedTime = wallTime - saoPauloOffsetMinutes(new Date(utcTime)) * 60_000
  return new Date(correctedTime).toISOString()
}

export function LeadDetailControls({
  lead,
  admin,
}: {
  lead: LeadControls
  admin: AdminInfo
}) {
  return (
    <div className="space-y-5">
      <StatusForm key={lead.status} lead={lead} />
      <NextActionForm key={[lead.next_action ?? "", lead.next_action_at ?? ""].join("|")} lead={lead} />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <ProbabilityForm key={lead.probability ?? ""} lead={lead} />
        <TagsForm key={(lead.tags ?? []).join("|")} lead={lead} />
      </div>
      {lead.status === "nao_convertido" && <NonConversionForm key={lead.non_conversion_reason ?? ""} lead={lead} />}
      <AssigneeForm key={lead.assigned_to ?? ""} lead={lead} admin={admin} />
      {!lead.responded_at && <RespondedForm leadId={lead.id} />}
    </div>
  )
}

function StatusForm({ lead }: { lead: LeadControls }) {
  const [state, action, pending] = useActionState(updateLeadStatus, undefined)
  useRefreshAfterMutation(state)
  return (
    <section className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Etapa comercial</h2>
      <Form action={action} className="mt-4 gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="lead_id" value={lead.id} />
        <input type="hidden" name="expected_status" value={lead.status} />
        <FormField htmlFor="lead-status" label="Status atual">
          <FormSelect id="lead-status" name="status" defaultValue={lead.status}>
            {LEAD_STATUS_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </FormSelect>
        </FormField>
        <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:w-auto sm:min-w-[150px] sm:self-end">
          {pending ? "Salvando..." : "Atualizar status"}
        </FormSubmitButton>
      </Form>
      <div className="mt-3"><ActionFeedback state={state} success="Status atualizado." /></div>
    </section>
  )
}

function NextActionForm({ lead }: { lead: LeadControls }) {
  const [state, action, pending] = useActionState(updateLeadNextAction, undefined)
  const [date, setDate] = useState(localInputValue(lead.next_action_at))
  useRefreshAfterMutation(state)
  return (
    <section className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Próxima ação</h2>
      <p className="mt-1 text-xs text-[#999]">Defina o acompanhamento e quando ele deve acontecer.</p>
      <Form action={action} className="mt-4 gap-4">
        <input type="hidden" name="lead_id" value={lead.id} />
        <input type="hidden" name="next_action_at" value={isoFromLocal(date)} />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField htmlFor="next-action" label="O que precisa ser feito?">
            <FormInput id="next-action" name="next_action" maxLength={200} defaultValue={lead.next_action ?? ""} placeholder="Ex.: enviar proposta revisada" />
          </FormField>
          <FormField htmlFor="next-action-date" label="Data e horário (Brasília)">
            <FormInput id="next-action-date" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} />
          </FormField>
        </div>
        <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:w-auto sm:self-start">{pending ? "Salvando..." : "Salvar próxima ação"}</FormSubmitButton>
        <ActionFeedback state={state} success="Próxima ação atualizada." />
      </Form>
    </section>
  )
}

function ProbabilityForm({ lead }: { lead: LeadControls }) {
  const [state, action, pending] = useActionState(updateLeadProbability, undefined)
  useRefreshAfterMutation(state)
  return (
    <section className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Probabilidade</h2>
      <Form action={action} className="mt-4 gap-3">
        <input type="hidden" name="lead_id" value={lead.id} />
        <FormField htmlFor="lead-probability" label="Chance de fechar">
          <FormSelect id="lead-probability" name="probability" defaultValue={lead.probability ?? ""}>
            <option value="">Não definida</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta</option>
          </FormSelect>
        </FormField>
        <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:self-start">{pending ? "Salvando..." : "Salvar probabilidade"}</FormSubmitButton>
        <ActionFeedback state={state} success="Probabilidade atualizada." />
      </Form>
    </section>
  )
}

function TagsForm({ lead }: { lead: LeadControls }) {
  const [state, action, pending] = useActionState(updateLeadTags, undefined)
  const [text, setText] = useState((lead.tags ?? []).join(", "))
  const tags = text.split(",").map((tag) => tag.trim()).filter(Boolean)
  useRefreshAfterMutation(state)
  return (
    <section className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Tags</h2>
      <Form action={action} className="mt-4 gap-3">
        <input type="hidden" name="lead_id" value={lead.id} />
        {tags.map((tag, index) => <input key={index} type="hidden" name="tags" value={tag} />)}
        <FormField htmlFor="lead-tags" label="Separe as tags por vírgula">
          <FormInput id="lead-tags" value={text} onChange={(event) => setText(event.target.value)} placeholder="Ex.: urgente, indicação" />
        </FormField>
        <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:self-start">{pending ? "Salvando..." : "Salvar tags"}</FormSubmitButton>
        <ActionFeedback state={state} success="Tags atualizadas." />
      </Form>
    </section>
  )
}

function NonConversionForm({ lead }: { lead: LeadControls }) {
  const [state, action, pending] = useActionState(updateLeadNonConversionReason, undefined)
  useRefreshAfterMutation(state)
  return (
    <section className="rounded-xl border border-amber-900/50 bg-amber-950/15 p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Motivo da não conversão</h2>
      <Form action={action} className="mt-4 gap-3">
        <input type="hidden" name="lead_id" value={lead.id} />
        <FormField htmlFor="non-conversion-reason" label="Registrar motivo">
          <FormTextarea id="non-conversion-reason" name="non_conversion_reason" rows={3} maxLength={5000} defaultValue={lead.non_conversion_reason ?? ""} />
        </FormField>
        <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:w-auto sm:self-start">{pending ? "Salvando..." : "Salvar motivo"}</FormSubmitButton>
        <ActionFeedback state={state} success="Motivo atualizado." />
      </Form>
    </section>
  )
}

function AssigneeForm({ lead, admin }: { lead: LeadControls; admin: AdminInfo }) {
  const [state, action, pending] = useActionState(updateLeadAssignee, undefined)
  useRefreshAfterMutation(state)
  return (
    <section className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">Responsável</h2>
      <p className="mt-1 text-xs leading-5 text-[#999]">Você pode atribuir a si mesmo ou deixar sem responsável. A lista completa da equipe ainda não está disponível para esta tela.</p>
      <Form action={action} className="mt-4 gap-3 sm:flex-row sm:items-end">
        <input type="hidden" name="lead_id" value={lead.id} />
        <input type="hidden" name="expected_assigned_to" value={lead.assigned_to ?? ""} />
        <FormField htmlFor="lead-assignee" label="Atribuir para">
          <FormSelect id="lead-assignee" name="assigned_to" defaultValue={lead.assigned_to ?? ""}>
            <option value="">Sem responsável</option>
            {lead.assigned_to && lead.assigned_to !== admin.id && <option value={lead.assigned_to}>Membro atual da equipe</option>}
            <option value={admin.id}>Você{admin.name ? " · " + admin.name : ""}</option>
          </FormSelect>
        </FormField>
        <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:w-auto sm:min-w-[150px] sm:self-end">{pending ? "Salvando..." : "Salvar responsável"}</FormSubmitButton>
      </Form>
      <div className="mt-3"><ActionFeedback state={state} success="Responsável atualizado." /></div>
    </section>
  )
}

function RespondedForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(markLeadResponded, undefined)
  useRefreshAfterMutation(state)
  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div>
        <h2 className="text-base font-semibold text-white">Retorno ao cliente</h2>
        <p className="mt-1 text-xs text-[#999]">Marque quando a equipe já tiver respondido.</p>
        <ActionFeedback state={state} success="Lead marcado como respondido." />
      </div>
      <Form action={action}>
        <input type="hidden" name="lead_id" value={leadId} />
        <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:w-auto">{pending ? "Salvando..." : "Marcar respondido"}</FormSubmitButton>
      </Form>
    </section>
  )
}

export function InteractionForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(createLeadInteraction, undefined)
  const [date, setDate] = useState("")
  useRefreshAfterMutation(state)
  return (
    <Form action={action} className="gap-4">
      <input type="hidden" name="lead_id" value={leadId} />
      <input type="hidden" name="occurred_at" value={isoFromLocal(date)} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField htmlFor="interaction-type" label="Tipo de registro">
          <FormSelect id="interaction-type" name="type" defaultValue="nota">
            <option value="nota">Nota interna</option>
            <option value="mensagem_enviada">Mensagem enviada</option>
            <option value="mensagem_recebida">Mensagem recebida</option>
          </FormSelect>
        </FormField>
        <FormField htmlFor="interaction-date" label="Data e horário (Brasília, opcional)">
          <FormInput id="interaction-date" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} />
        </FormField>
      </div>
      <FormField htmlFor="interaction-content" label="Conteúdo">
        <FormTextarea id="interaction-content" name="content" rows={4} maxLength={5000} required placeholder="Registre o que foi conversado ou uma nota para a equipe." />
      </FormField>
      <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:w-auto sm:self-start">{pending ? "Registrando..." : "Adicionar à timeline"}</FormSubmitButton>
      <ActionFeedback state={state} success="Interação adicionada à timeline." />
    </Form>
  )
}

function MeetingStatusForm({
  meeting,
}: {
  meeting: { id: string; status: "agendada" | "realizada" | "cancelada" }
}) {
  const [state, action, pending] = useActionState(updateLeadMeetingStatus, undefined)
  useRefreshAfterMutation(state)
  if (meeting.status !== "agendada") return <span className="text-xs text-[#85867f]">{meeting.status === "realizada" ? "Concluída" : "Cancelada"}</span>
  return (
    <Form action={action} className="flex flex-wrap gap-2">
      <input type="hidden" name="meeting_id" value={meeting.id} />
      <input type="hidden" name="expected_status" value={meeting.status} />
      <button name="status" value="realizada" disabled={pending} className="rounded-md border border-[#3a5d45] px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-950/40 disabled:opacity-50">Concluir</button>
      <button name="status" value="cancelada" disabled={pending} className="rounded-md border border-[#5a3934] px-3 py-2 text-xs text-[#e9b7ac] hover:bg-red-950/30 disabled:opacity-50">Cancelar</button>
      <ActionFeedback state={state} success="Reunião atualizada." />
    </Form>
  )
}

export function MeetingForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(createLeadMeeting, undefined)
  const [date, setDate] = useState("")
  useRefreshAfterMutation(state)
  return (
    <Form action={action} className="gap-4">
      <input type="hidden" name="lead_id" value={leadId} />
      <input type="hidden" name="scheduled_at" value={isoFromLocal(date)} />
      <FormField htmlFor="meeting-date" label="Data e horário (Brasília)">
        <FormInput id="meeting-date" type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} required />
      </FormField>
      <FormField htmlFor="meeting-notes" label="Pauta ou observações">
        <FormTextarea id="meeting-notes" name="notes" rows={3} maxLength={5000} placeholder="Opcional" />
      </FormField>
      <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:w-auto sm:self-start">{pending ? "Agendando..." : "Agendar reunião"}</FormSubmitButton>
      <ActionFeedback state={state} success="Reunião agendada." />
    </Form>
  )
}

export function MeetingActions({ meeting }: {
  meeting: { id: string; status: "agendada" | "realizada" | "cancelada" }
}) {
  return <MeetingStatusForm meeting={meeting} />
}

