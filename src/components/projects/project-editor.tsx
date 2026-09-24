"use client"

import Link from "next/link"
import { useState } from "react"

import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormSubmitButton,
} from "@/components/forms/form"

export type EditableProject = {
  id: string
  title: string
  client_name: string | null
  lead_id: string | null
  status: "em_andamento" | "concluido" | "cancelado"
  started_at: string | null
  finished_at: string | null
}

export type LeadOption = { id: string; name: string; company: string | null }

export function ProjectEditor({
  initial,
  leads,
}: {
  initial?: EditableProject
  leads: LeadOption[]
}) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [status, setStatus] = useState<EditableProject["status"]>(initial?.status ?? "em_andamento")
  const [clientName, setClientName] = useState(initial?.client_name ?? "")
  const leadIsMissing = Boolean(initial?.lead_id && !leads.some((lead) => lead.id === initial.lead_id))

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.65fr)]">
      <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-8">
        <p role="status" className="mb-7 rounded-md border border-[#62532c] bg-[#2a2517] p-4 text-sm leading-6 text-[#e6d9a9]">
          Prévia do editor. O salvamento de projetos será ativado quando a integração estiver disponível.
        </p>
        <Form onSubmit={(event) => event.preventDefault()} className="gap-7">
          <section aria-labelledby="project-identity-title" className="space-y-5">
            <h2 id="project-identity-title" className="text-lg font-semibold text-white">Informações do projeto</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="project-title" label="Título *" className="sm:col-span-2">
                <FormInput id="project-title" name="title" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} required />
              </FormField>
              <FormField htmlFor="project-client" label="Cliente">
                <FormInput id="project-client" name="client_name" maxLength={200} value={clientName} onChange={(event) => setClientName(event.target.value)} />
              </FormField>
              <FormField htmlFor="project-lead" label="Lead vinculado" hint="Opcional. A lista mostra os leads mais recentes.">
                <FormSelect id="project-lead" name="lead_id" defaultValue={initial?.lead_id ?? ""}>
                  <option value="">Nenhum lead vinculado</option>
                  {leadIsMissing && <option value={initial?.lead_id ?? ""}>Lead vinculado atualmente</option>}
                  {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}{lead.company ? " · " + lead.company : ""}</option>)}
                </FormSelect>
              </FormField>
            </div>
          </section>

          <section aria-labelledby="project-progress-title" className="space-y-5 border-t border-[#292b28] pt-7">
            <h2 id="project-progress-title" className="text-lg font-semibold text-white">Andamento</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="project-status" label="Status">
                <FormSelect id="project-status" name="status" value={status} onChange={(event) => setStatus(event.target.value as EditableProject["status"])} disabled={!initial}>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluido">Concluído</option>
                  <option value="cancelado">Cancelado</option>
                </FormSelect>
              </FormField>
              <FormField htmlFor="project-start" label="Início">
                <FormInput id="project-start" name="started_at" type="date" defaultValue={initial?.started_at ?? ""} />
              </FormField>
              {status === "concluido" && (
                <FormField htmlFor="project-finish" label="Conclusão">
                  <FormInput id="project-finish" name="finished_at" type="date" defaultValue={initial?.finished_at ?? ""} required />
                </FormField>
              )}
            </div>
            {!initial && <p className="text-xs leading-5 text-[#92938d]">Projetos novos começam com status “Em andamento”.</p>}
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-[#292b28] pt-6 sm:flex-row sm:items-center">
            <Link href="/painel-8f2k/projetos" className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-[#fbd020]">Voltar aos projetos</Link>
            <FormSubmitButton disabled className="mt-0 w-full self-stretch sm:w-auto sm:min-w-[200px] sm:self-auto">Salvar projeto</FormSubmitButton>
          </div>
        </Form>
      </div>

      <aside className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Prévia</p>
        <h2 className="mt-4 break-words text-lg font-semibold text-white">{title || "Novo projeto"}</h2>
        <p className="mt-1 text-sm text-[#aaa]">{clientName || "Cliente não informado"}</p>
        <span className="mt-4 inline-flex rounded-full border border-[#50514a] px-3 py-1 text-xs text-[#d3d4ce]">
          {status === "em_andamento" ? "Em andamento" : status === "concluido" ? "Concluído" : "Cancelado"}
        </span>
        <p className="mt-5 text-xs leading-5 text-[#85867f]">Este projeto pode ser vinculado a um case publicado e a lançamentos do financeiro, independentemente de aparecer no portfólio.</p>
      </aside>
    </div>
  )
}
