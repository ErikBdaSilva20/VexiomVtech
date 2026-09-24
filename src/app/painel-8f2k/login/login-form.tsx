"use client"

import { useActionState } from "react"

import {
  Form,
  FormField,
  FormInput,
  FormSubmitButton,
} from "@/components/forms/form"

import { login } from "./actions"

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined)

  return (
    <Form action={formAction} className="gap-[calc(18*var(--unit))]">
      <FormField htmlFor="login-email" label="E-mail">
        <FormInput
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
      </FormField>
      <FormField htmlFor="login-password" label="Senha">
        <FormInput
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </FormField>
      {state?.error && (
        <p
          className="rounded-[4px] border border-[#7c3434] bg-[#351b1b] px-[14px] py-[12px] text-[13px] leading-[1.5] text-[#ffd6d6]"
          role="alert"
        >
          {state.error}
        </p>
      )}
      <FormSubmitButton
        disabled={pending}
        className="mt-[calc(4*var(--unit))] w-full self-stretch [@media(max-width:650px)]:w-full"
      >
        {pending ? "Entrando..." : "Entrar"}
      </FormSubmitButton>
    </Form>
  )
}
