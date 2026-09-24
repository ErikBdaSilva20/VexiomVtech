"use client"

import { useActionState } from "react"

import { login } from "./actions"

/**
 * Functional-only login form — no Tailwind classes, no styling polish.
 * Visual design is explicitly deferred to a later front-end pass.
 */
export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined)

  return (
    <form action={formAction}>
      <div>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label htmlFor="password">Senha</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      {state?.error && <p role="alert">{state.error}</p>}
      <button disabled={pending} type="submit">
        Entrar
      </button>
    </form>
  )
}
