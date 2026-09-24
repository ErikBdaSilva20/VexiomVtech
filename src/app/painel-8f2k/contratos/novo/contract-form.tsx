"use client"

import Link from "next/link"
import { useActionState, useState } from "react"

import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormSubmitButton,
} from "@/components/forms/form"

import { createContractAction } from "../actions"

const SERVICE_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "site", label: "Site" },
  { value: "sistema_sob_medida", label: "Sistema sob medida" },
  { value: "aplicativo", label: "Aplicativo" },
  { value: "manutencao", label: "Manutenção" },
  { value: "consultoria", label: "Consultoria" },
  { value: "demanda", label: "Demanda (por hora)" },
]

type LeadOption = { id: string; label: string }

export function ContractForm({ leads }: { leads: LeadOption[] }) {
  const [state, formAction, pending] = useActionState(createContractAction, undefined)
  const [serviceTypes, setServiceTypes] = useState<string[]>([])

  if (state?.status === "success") {
    return (
      <section aria-live="polite" className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-6 sm:p-8">
        <p className="text-sm font-semibold text-emerald-300">Contrato registrado</p>
        <h2 className="mt-2 text-xl font-semibold text-white">O contrato já está no histórico.</h2>
        <Link href="/painel-8f2k/contratos" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510] hover:bg-[#ffe45d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">
          Voltar para contratos
        </Link>
      </section>
    )
  }

  const fieldError = (name: string) => state?.status === "error" ? state.fieldErrors?.[name]?.[0] : undefined
  const requiresHours = serviceTypes.includes("demanda")

  function toggleServiceType(value: string, checked: boolean) {
    setServiceTypes((current) =>
      checked ? [...current, value] : current.filter((item) => item !== value)
    )
  }

  return (
    <Form action={formAction} aria-busy={pending} className="gap-7">
      {state?.status === "error" && (
        <p role="alert" aria-live="assertive" className="rounded-md border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      )}

      <FormField htmlFor="contract-lead" label="Lead *" error={fieldError("lead_id")}>
        <FormSelect id="contract-lead" name="lead_id" defaultValue="" required aria-invalid={Boolean(fieldError("lead_id"))}>
          <option value="" disabled>Selecione o lead</option>
          {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.label}</option>)}
        </FormSelect>
      </FormField>

      <FormField htmlFor="contract-service-types" label="Tipos de serviço *" error={fieldError("service_types")}>
        <div id="contract-service-types" className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {SERVICE_TYPE_OPTIONS.map((option) => (
            <label key={option.value} className="flex min-h-11 items-center gap-2 rounded-md border border-[#3a3b39] bg-[#131413] px-3 py-2 text-sm text-[#f0f0f1]">
              <input
                type="checkbox"
                name="service_types"
                value={option.value}
                checked={serviceTypes.includes(option.value)}
                onChange={(event) => toggleServiceType(option.value, event.target.checked)}
                className="h-4 w-4 accent-[#fbd020]"
              />
              {option.label}
            </label>
          ))}
        </div>
      </FormField>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <FormField htmlFor="contract-amount" label="Valor (R$) *" error={fieldError("amount")}>
          <FormInput id="contract-amount" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0,00" required aria-invalid={Boolean(fieldError("amount"))} />
        </FormField>
        <FormField
          htmlFor="contract-hours"
          label={"Horas" + (requiresHours ? " *" : "")}
          hint={requiresHours ? "Obrigatório para contratos de demanda." : "Preencha apenas para contratos de demanda."}
          error={fieldError("hours")}
        >
          <FormInput id="contract-hours" name="hours" type="number" min="0.01" step="0.01" inputMode="decimal" required={requiresHours} aria-invalid={Boolean(fieldError("hours"))} />
        </FormField>
      </div>

      <FormField htmlFor="contract-file" label="Anexo (PDF)" hint="Opcional. Máximo de 10MB, apenas PDF." error={fieldError("file")}>
        <FormInput id="contract-file" name="file" type="file" accept="application/pdf" />
      </FormField>

      <div className="flex flex-col-reverse gap-3 border-t border-[#292b28] pt-6 sm:flex-row sm:items-center">
        <Link href="/painel-8f2k/contratos" className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm text-[#c2c2bb] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">
          Cancelar
        </Link>
        <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:w-auto sm:min-w-[220px] sm:self-auto">
          {pending ? "Salvando contrato..." : "Registrar contrato"}
        </FormSubmitButton>
      </div>
    </Form>
  )
}
