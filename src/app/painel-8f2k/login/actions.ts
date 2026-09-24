"use server"

import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"

export type LoginState = { error: string } | undefined

/**
 * Login Server Action (FR1). Validates credentials against Supabase Auth
 * only — it does not check `admin_users` itself. A user authenticated in
 * Supabase Auth but absent from `admin_users` still gets a session here;
 * `proxy.ts` catches that case on the very next request to
 * `/painel-8f2k/leads` and redirects back to login (FR1 AC3), so the
 * "unauthorized" outcome is enforced in exactly one place.
 */
export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim()
  const password = String(formData.get("password") ?? "")

  if (!email || !password) {
    return { error: "Informe e-mail e senha." }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { error: "E-mail ou senha inválidos." }
  }

  redirect("/painel-8f2k/leads")
}
