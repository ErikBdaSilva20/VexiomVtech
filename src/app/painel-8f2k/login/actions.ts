"use server"

import { createClient } from "@/lib/supabase/server"

export type LoginState =
  | { status: "error"; error: string }
  | { status: "success" }
  | undefined

function authErrorMessage(error: { code?: string; name?: string; status?: number }) {
  if (error.code === "invalid_credentials" || error.name === "AuthInvalidCredentialsError") {
    return "E-mail ou senha incorretos. Confira os dados e tente novamente."
  }

  if (error.code === "email_not_confirmed") {
    return "Este e-mail ainda não foi confirmado."
  }

  if (error.code === "over_request_rate_limit") {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente."
  }

  if (!error.status || error.status >= 500 || error.name === "AuthRetryableFetchError") {
    return "Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente."
  }

  return "Não foi possível entrar agora. Tente novamente em instantes."
}

/**
 * Login Server Action (FR1). Authenticates with Supabase and verifies the
 * matching `admin_users` row before reporting success. This prevents a
 * valid non-admin account from entering a redirect loop between the login
 * page and the protected panel.
 */
export async function login(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  const rawEmail = formData.get("email")
  const rawPassword = formData.get("password")

  if (typeof rawEmail !== "string" || typeof rawPassword !== "string") {
    return { status: "error", error: "Informe e-mail e senha." }
  }

  const email = rawEmail.trim()
  const password = rawPassword

  if (!email || !password) {
    return { status: "error", error: "Informe e-mail e senha." }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { status: "error", error: authErrorMessage(error) }
    }

    const { data: adminUser, error: adminError } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle()

    if (adminError) {
      console.error("login: failed to verify admin access", adminError)
      await supabase.auth.signOut({ scope: "local" })
      return {
        status: "error",
        error: "Login confirmado, mas não foi possível verificar seu acesso ao painel. Tente novamente.",
      }
    }

    if (!adminUser) {
      await supabase.auth.signOut({ scope: "local" })
      return { status: "error", error: "Esta conta não possui acesso ao painel administrativo." }
    }

    return { status: "success" }
  } catch (error) {
    console.error("login: authentication request failed", error)
    return {
      status: "error",
      error: "Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente.",
    }
  }
}
