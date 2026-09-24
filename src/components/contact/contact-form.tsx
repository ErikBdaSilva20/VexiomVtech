"use client"

import { useState, type FormEvent } from "react"

import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
} from "@/components/forms/form"

type ContactFieldName =
  | "name"
  | "company"
  | "email"
  | "whatsapp"
  | "project_type"
  | "description"
  | "desired_deadline"
  | "budget_range"
  | "preferred_channel"
  | "preferred_time"

type ContactFieldErrors = Partial<Record<ContactFieldName, string>>

type LeadApiResponse = {
  error?: string
  fieldErrors?: Partial<Record<ContactFieldName, string[]>>
}

type FormStatus = {
  type: "success" | "error"
  message: string
}

const projectTypes = [
  "Site ou sistema sob medida",
  "Automação com inteligência artificial",
  "Loja virtual ou e-commerce",
  "Produto próprio",
  "Suporte, manutenção ou evolução de aplicação",
  "Outro tipo de projeto",
]

function getDescribedBy(id: string, error?: string, hasHint = false) {
  const ids: string[] = []

  if (hasHint) ids.push(id + "-hint")
  if (error) ids.push(id + "-error")

  return ids.length > 0 ? ids.join(" ") : undefined
}

export function ContactForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ContactFieldErrors>({})
  const [status, setStatus] = useState<FormStatus | null>(null)

  function clearFieldError(field: ContactFieldName) {
    setFieldErrors((current) => {
      if (!current[field]) return current

      const next = { ...current }
      delete next[field]
      return next
    })
    setStatus(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const form = event.currentTarget
    setStatus(null)
    setFieldErrors({})

    const invalidControl = form.querySelector<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >(":invalid")

    if (invalidControl) {
      const fieldName = invalidControl.name as ContactFieldName
      const label = invalidControl.labels?.[0]?.textContent?.trim() || "este campo"
      const message = invalidControl.validity.valueMissing
        ? label + " é obrigatório."
        : "Confira " + label + "."

      setFieldErrors({ [fieldName]: message })
      setStatus({ type: "error", message })
      invalidControl.focus()
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      })
      const result = (await response.json().catch(() => null)) as LeadApiResponse | null

      if (!response.ok) {
        const nextErrors: ContactFieldErrors = {}

        for (const field of Object.keys(result?.fieldErrors ?? {}) as ContactFieldName[]) {
          const message = result?.fieldErrors?.[field]?.[0]
          if (message) nextErrors[field] = message
        }

        setFieldErrors(nextErrors)
        setStatus({
          type: "error",
          message:
            Object.keys(nextErrors).length > 0
              ? "Confira os campos destacados e tente novamente."
              : result?.error ?? "Não foi possível enviar o formulário. Tente novamente.",
        })

        const firstError = Object.keys(nextErrors)[0] as ContactFieldName | undefined
        const firstControl = firstError
          ? form.elements.namedItem(firstError)
          : null
        if (firstControl instanceof HTMLElement) firstControl.focus()
        return
      }

      form.reset()
      setStatus({
        type: "success",
        message:
          "Recebemos seu contato. Vamos analisar as informações e retornar pelo canal indicado.",
      })
    } catch {
      setStatus({
        type: "error",
        message:
          "Não foi possível enviar agora. Verifique sua conexão e tente novamente.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form
      className="max-w-[calc(720*var(--unit))]"
      onSubmit={handleSubmit}
      noValidate
      aria-busy={isSubmitting}
    >
      <p className="text-[11px] leading-[1.5] text-[#858782]">
        Campos com * são obrigatórios.
      </p>

      {status && (
        <p
          className={
            status.type === "success"
              ? "rounded-[4px] border border-[#3d754f] bg-[#14251b] px-[14px] py-[12px] text-[13px] leading-[1.55] text-[#c3f1d1]"
              : "rounded-[4px] border border-[#7c3434] bg-[#351b1b] px-[14px] py-[12px] text-[13px] leading-[1.55] text-[#ffd6d6]"
          }
          role={status.type === "error" ? "alert" : "status"}
          aria-live={status.type === "error" ? "assertive" : "polite"}
        >
          {status.message}
        </p>
      )}

      <div className="grid grid-cols-2 gap-[calc(20*var(--unit))] [@media(max-width:650px)]:grid-cols-1">
        <FormField
          htmlFor="contact-name"
          label="Nome *"
          error={fieldErrors.name}
        >
          <FormInput
            id="contact-name"
            name="name"
            type="text"
            autoComplete="name"
            maxLength={200}
            required
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={getDescribedBy("contact-name", fieldErrors.name)}
            onChange={() => clearFieldError("name")}
          />
        </FormField>

        <FormField
          htmlFor="contact-company"
          label="Empresa (opcional)"
          error={fieldErrors.company}
        >
          <FormInput
            id="contact-company"
            name="company"
            type="text"
            autoComplete="organization"
            maxLength={200}
            aria-invalid={Boolean(fieldErrors.company)}
            aria-describedby={getDescribedBy("contact-company", fieldErrors.company)}
            onChange={() => clearFieldError("company")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-[calc(20*var(--unit))] [@media(max-width:650px)]:grid-cols-1">
        <FormField
          htmlFor="contact-email"
          label="E-mail *"
          error={fieldErrors.email}
        >
          <FormInput
            id="contact-email"
            name="email"
            type="email"
            autoComplete="email"
            maxLength={200}
            required
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={getDescribedBy("contact-email", fieldErrors.email)}
            onChange={() => clearFieldError("email")}
          />
        </FormField>

        <FormField
          htmlFor="contact-whatsapp"
          label="WhatsApp *"
          hint="Inclua o DDD para facilitar nosso retorno."
          error={fieldErrors.whatsapp}
        >
          <FormInput
            id="contact-whatsapp"
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            maxLength={200}
            required
            aria-invalid={Boolean(fieldErrors.whatsapp)}
            aria-describedby={getDescribedBy("contact-whatsapp", fieldErrors.whatsapp, true)}
            onChange={() => clearFieldError("whatsapp")}
          />
        </FormField>
      </div>

      <FormField
        htmlFor="contact-project-type"
        label="Tipo de projeto *"
        error={fieldErrors.project_type}
      >
        <FormSelect
          id="contact-project-type"
          name="project_type"
          required
          defaultValue=""
          aria-invalid={Boolean(fieldErrors.project_type)}
          aria-describedby={getDescribedBy("contact-project-type", fieldErrors.project_type)}
          onChange={() => clearFieldError("project_type")}
        >
          <option value="" disabled>
            Selecione uma opção
          </option>
          {projectTypes.map((projectType) => (
            <option key={projectType} value={projectType}>
              {projectType}
            </option>
          ))}
        </FormSelect>
      </FormField>

      <FormField
        htmlFor="contact-description"
        label="Conte sobre sua necessidade *"
        error={fieldErrors.description}
      >
        <FormTextarea
          id="contact-description"
          name="description"
          rows={6}
          maxLength={5000}
          placeholder="O que você precisa resolver ou melhorar?"
          required
          aria-invalid={Boolean(fieldErrors.description)}
          aria-describedby={getDescribedBy("contact-description", fieldErrors.description)}
          onChange={() => clearFieldError("description")}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-[calc(20*var(--unit))] [@media(max-width:650px)]:grid-cols-1">
        <FormField
          htmlFor="contact-deadline"
          label="Prazo desejado (opcional)"
          error={fieldErrors.desired_deadline}
        >
          <FormInput
            id="contact-deadline"
            name="desired_deadline"
            type="text"
            maxLength={200}
            placeholder="Ex.: nos próximos dois meses"
            aria-invalid={Boolean(fieldErrors.desired_deadline)}
            aria-describedby={getDescribedBy("contact-deadline", fieldErrors.desired_deadline)}
            onChange={() => clearFieldError("desired_deadline")}
          />
        </FormField>

        <FormField
          htmlFor="contact-budget"
          label="Faixa de investimento (opcional)"
          error={fieldErrors.budget_range}
        >
          <FormInput
            id="contact-budget"
            name="budget_range"
            type="text"
            maxLength={200}
            placeholder="Ex.: ainda estou avaliando"
            aria-invalid={Boolean(fieldErrors.budget_range)}
            aria-describedby={getDescribedBy("contact-budget", fieldErrors.budget_range)}
            onChange={() => clearFieldError("budget_range")}
          />
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-[calc(20*var(--unit))] [@media(max-width:650px)]:grid-cols-1">
        <FormField
          htmlFor="contact-channel"
          label="Melhor canal para contato (opcional)"
          error={fieldErrors.preferred_channel}
        >
          <FormSelect
            id="contact-channel"
            name="preferred_channel"
            defaultValue=""
            aria-invalid={Boolean(fieldErrors.preferred_channel)}
            aria-describedby={getDescribedBy("contact-channel", fieldErrors.preferred_channel)}
            onChange={() => clearFieldError("preferred_channel")}
          >
            <option value="">Sem preferência</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="E-mail">E-mail</option>
            <option value="Ligação">Ligação</option>
            <option value="Outro">Outro</option>
          </FormSelect>
        </FormField>

        <FormField
          htmlFor="contact-time"
          label="Melhor horário (opcional)"
          error={fieldErrors.preferred_time}
        >
          <FormInput
            id="contact-time"
            name="preferred_time"
            type="text"
            maxLength={200}
            placeholder="Ex.: dias úteis, depois das 14h"
            aria-invalid={Boolean(fieldErrors.preferred_time)}
            aria-describedby={getDescribedBy("contact-time", fieldErrors.preferred_time)}
            onChange={() => clearFieldError("preferred_time")}
          />
        </FormField>
      </div>

      <FormSubmitButton
        disabled={isSubmitting}
        className="disabled:before:bg-[#b0aa72]"
      >
        {isSubmitting ? "Enviando..." : "Enviar mensagem"}
      </FormSubmitButton>
    </Form>
  )
}
