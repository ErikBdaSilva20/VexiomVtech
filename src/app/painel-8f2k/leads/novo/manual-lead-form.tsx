"use client"

import Link from "next/link"
import { useActionState } from "react"

import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
} from "@/components/forms/form"

import { createManualLead } from "./actions"

const PROJECT_TYPES = [
  "Site ou sistema sob medida",
  "Automação com inteligência artificial",
  "Loja virtual ou e-commerce",
  "Produto próprio",
  "Suporte, manutenção ou evolução de aplicação",
  "Outro tipo de projeto",
]

export function ManualLeadForm() {
  const [state, formAction, pending] = useActionState(createManualLead, undefined)

  if (state?.status === "success") {
    return (
      <section aria-live="polite" className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-6 sm:p-8">
        <p className="text-sm font-semibold text-emerald-300">Lead cadastrado</p>
        <h2 className="mt-2 text-xl font-semibold text-white">O contato já está na sua lista.</h2>
        <p className="mt-2 text-sm leading-6 text-[#b7b8b2]">Se houver uma possível duplicidade, ela ficará sinalizada junto ao lead.</p>
        <Link href="/painel-8f2k/leads" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510] hover:bg-[#ffe45d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">
          Voltar para leads
        </Link>
      </section>
    )
  }

  const fieldError = (name: string) => state?.status === "error" ? state.fieldErrors?.[name]?.[0] : undefined

  return (
    <Form action={formAction} aria-busy={pending} className="gap-7">
      <p className="text-xs leading-5 text-[#92938d]">Campos com * são obrigatórios. Os demais podem ser preenchidos depois.</p>

      {state?.status === "error" && (
        <p role="alert" aria-live="assertive" className="rounded-md border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-200">
          {state.error}
        </p>
      )}

      <section aria-labelledby="contact-data-title" className="space-y-5">
        <div>
          <h2 id="contact-data-title" className="text-base font-semibold text-white">Contato</h2>
          <p className="mt-1 text-xs text-[#92938d]">Como podemos identificar e retornar para essa pessoa?</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField htmlFor="manual-name" label="Nome *" error={fieldError("name")}>
            <FormInput id="manual-name" name="name" autoComplete="name" maxLength={200} required aria-invalid={Boolean(fieldError("name"))} />
          </FormField>
          <FormField htmlFor="manual-company" label="Empresa" error={fieldError("company")}>
            <FormInput id="manual-company" name="company" autoComplete="organization" maxLength={200} aria-invalid={Boolean(fieldError("company"))} />
          </FormField>
          <FormField htmlFor="manual-email" label="E-mail *" error={fieldError("email")}>
            <FormInput id="manual-email" name="email" type="email" autoComplete="email" maxLength={200} required aria-invalid={Boolean(fieldError("email"))} />
          </FormField>
          <FormField htmlFor="manual-whatsapp" label="WhatsApp *" error={fieldError("whatsapp")}>
            <FormInput id="manual-whatsapp" name="whatsapp" type="tel" autoComplete="tel" maxLength={200} required aria-invalid={Boolean(fieldError("whatsapp"))} />
          </FormField>
        </div>
      </section>

      <section aria-labelledby="project-data-title" className="space-y-5 border-t border-[#292b28] pt-6">
        <div>
          <h2 id="project-data-title" className="text-base font-semibold text-white">Projeto</h2>
          <p className="mt-1 text-xs text-[#92938d]">Registre o que a pessoa está buscando.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <FormField htmlFor="manual-project-type" label="Tipo de projeto *" error={fieldError("project_type")}>
            <FormSelect id="manual-project-type" name="project_type" defaultValue="" required aria-invalid={Boolean(fieldError("project_type"))}>
              <option value="" disabled>Selecione ou descreva em “Outro”</option>
              {PROJECT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </FormSelect>
          </FormField>
          <FormField htmlFor="manual-source" label="Origem do contato *" hint="Ex.: indicação, evento ou Instagram." error={fieldError("source")}>
            <FormInput id="manual-source" name="source" maxLength={200} placeholder="De onde veio esse contato?" required aria-invalid={Boolean(fieldError("source"))} />
          </FormField>
          <FormField htmlFor="manual-description" label="Descrição do pedido *" className="sm:col-span-2" error={fieldError("description")}>
            <FormTextarea id="manual-description" name="description" rows={5} maxLength={5000} required aria-invalid={Boolean(fieldError("description"))} />
          </FormField>
          <FormField htmlFor="manual-deadline" label="Prazo desejado" error={fieldError("desired_deadline")}>
            <FormInput id="manual-deadline" name="desired_deadline" maxLength={200} placeholder="Ex.: nos próximos 2 meses" aria-invalid={Boolean(fieldError("desired_deadline"))} />
          </FormField>
          <FormField htmlFor="manual-budget" label="Faixa de investimento" error={fieldError("budget_range")}>
            <FormInput id="manual-budget" name="budget_range" maxLength={200} placeholder="Ex.: R$ 10 mil a R$ 20 mil" aria-invalid={Boolean(fieldError("budget_range"))} />
          </FormField>
          <FormField htmlFor="manual-channel" label="Canal preferido" error={fieldError("preferred_channel")}>
            <FormInput id="manual-channel" name="preferred_channel" maxLength={200} placeholder="Ex.: WhatsApp ou e-mail" aria-invalid={Boolean(fieldError("preferred_channel"))} />
          </FormField>
          <FormField htmlFor="manual-time" label="Melhor horário" error={fieldError("preferred_time")}>
            <FormInput id="manual-time" name="preferred_time" maxLength={200} placeholder="Ex.: manhã" aria-invalid={Boolean(fieldError("preferred_time"))} />
          </FormField>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-[#292b28] pt-6 sm:flex-row sm:items-center">
        <Link href="/painel-8f2k/leads" className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm text-[#c2c2bb] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">
          Cancelar
        </Link>
        <FormSubmitButton disabled={pending} className="mt-0 w-full self-stretch sm:w-auto sm:min-w-[220px] sm:self-auto">
          {pending ? "Salvando lead..." : "Cadastrar lead"}
        </FormSubmitButton>
      </div>
    </Form>
  )
}

