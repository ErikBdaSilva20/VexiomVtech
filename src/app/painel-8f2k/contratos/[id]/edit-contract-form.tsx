"use client"

import Link from "next/link"
import { useActionState, useState } from "react"
import { Form, FormField, FormInput, FormSelect, FormSubmitButton } from "@/components/forms/form"
import { updateContractAction } from "../actions"

const OPTIONS = [
  ["site", "Site"], ["sistema_sob_medida", "Sistema sob medida"], ["aplicativo", "Aplicativo"],
  ["manutencao", "Manutenção"], ["consultoria", "Consultoria"], ["demanda", "Demanda (por hora)"],
] as const

type Props = { contract: { id: string; lead_id: string; service_types: string[]; amount: number; hours: number | null; hasFile: boolean }; leads: { id: string; label: string }[] }
export function EditContractForm({ contract, leads }: Props) {
  const [state, formAction, pending] = useActionState(updateContractAction, undefined)
  const [services, setServices] = useState(contract.service_types)
  const [removeFile, setRemoveFile] = useState(false)
  const error = (name: string) => state?.status === "error" ? state.fieldErrors?.[name]?.[0] : undefined
  const toggle = (value: string, checked: boolean) => setServices((current) => checked ? [...current, value] : current.filter((item) => item !== value))

  if (state?.status === "success") return <section className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-6"><p className="text-sm font-semibold text-emerald-300">Contrato atualizado</p><h2 className="mt-2 text-xl font-semibold text-white">As informações foram salvas.</h2><Link href={`/painel-8f2k/contratos/${contract.id}`} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510]">Voltar ao contrato</Link></section>

  return <Form action={formAction} aria-busy={pending} className="gap-7"><input type="hidden" name="contract_id" value={contract.id} />{state?.status === "error" && <p role="alert" className="rounded-md border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-200">{state.error}</p>}
    <FormField htmlFor="edit-contract-lead" label="Lead *" error={error("lead_id")}><FormSelect id="edit-contract-lead" name="lead_id" defaultValue={contract.lead_id} required aria-invalid={Boolean(error("lead_id"))}>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.label}</option>)}</FormSelect></FormField>
    <FormField htmlFor="edit-contract-services" label="Tipos de serviço *" error={error("service_types")}><div id="edit-contract-services" className="grid grid-cols-1 gap-2 sm:grid-cols-2">{OPTIONS.map(([value, label]) => <label key={value} className="flex min-h-11 items-center gap-2 rounded-md border border-[#3a3b39] bg-[#131413] px-3 py-2 text-sm text-[#f0f0f1]"><input type="checkbox" name="service_types" value={value} checked={services.includes(value)} onChange={(event) => toggle(value, event.target.checked)} className="h-4 w-4 accent-[#fbd020]" />{label}</label>)}</div></FormField>
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2"><FormField htmlFor="edit-contract-amount" label="Valor (R$) *" error={error("amount")}><FormInput id="edit-contract-amount" name="amount" type="number" min="0.01" step="0.01" defaultValue={contract.amount} required /></FormField><FormField htmlFor="edit-contract-hours" label={"Horas" + (services.includes("demanda") ? " *" : "")} hint="Obrigatório para demanda; substitui o valor anterior." error={error("hours")}><FormInput id="edit-contract-hours" name="hours" type="number" min="0.01" step="0.01" defaultValue={contract.hours ?? ""} required={services.includes("demanda")} /></FormField></div>
    <FormField htmlFor="edit-contract-file" label="Substituir anexo (PDF)" hint={contract.hasFile ? "Opcional. Se enviar, o PDF atual será substituído." : "Opcional. Máximo de 10MB, apenas PDF."}><FormInput id="edit-contract-file" name="file" type="file" accept="application/pdf" /></FormField>
    {contract.hasFile && <label className="flex items-center gap-2 text-sm text-[#c7c7c0]"><input type="checkbox" name="remove_file" checked={removeFile} onChange={(event) => setRemoveFile(event.target.checked)} className="h-4 w-4 accent-[#fbd020]" /> Remover o PDF atual (se nenhum novo for enviado)</label>}
    <div className="flex flex-col-reverse gap-3 border-t border-[#292b28] pt-6 sm:flex-row sm:items-center"><Link href={`/painel-8f2k/contratos/${contract.id}`} className="inline-flex min-h-11 items-center justify-center px-4 text-sm text-[#c2c2bb] hover:text-white">Cancelar</Link><FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:w-auto sm:min-w-[220px] sm:self-auto">{pending ? "Salvando alterações..." : "Salvar alterações"}</FormSubmitButton></div>
  </Form>
}
