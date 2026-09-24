import { beforeEach, describe, expect, it, vi } from "vitest"

import { createClient } from "@/lib/supabase/server"

import { login } from "./actions"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

function credentials(email = "admin@vexiom.com", password = "segredo") {
  const formData = new FormData()
  formData.set("email", email)
  formData.set("password", password)
  return formData
}

function authClient({
  signInResult,
  adminResult = { data: { user_id: "admin-1" }, error: null },
}: {
  signInResult:
    | { data: { user: { id: string } }; error: null }
    | { data: { user: null }; error: { code?: string; name?: string; status?: number } }
  adminResult?: { data: { user_id: string } | null; error: { message: string } | null }
}) {
  const maybeSingle = vi.fn().mockResolvedValue(adminResult)
  const eq = vi.fn(() => ({ maybeSingle }))
  const select = vi.fn(() => ({ eq }))
  const signOut = vi.fn().mockResolvedValue({ error: null })

  return {
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue(signInResult),
      signOut,
    },
    from: vi.fn(() => ({ select })),
    signOut,
  }
}

beforeEach(() => {
  vi.mocked(createClient).mockReset()
})

describe("login", () => {
  it("returns success after authenticating and confirming admin access", async () => {
    const client = authClient({
      signInResult: { data: { user: { id: "admin-1" } }, error: null },
    })
    vi.mocked(createClient).mockResolvedValue(client as never)

    const result = await login(undefined, credentials())

    expect(result).toEqual({ status: "success" })
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "admin@vexiom.com",
      password: "segredo",
    })
    expect(client.from).toHaveBeenCalledWith("admin_users")
  })

  it("reports invalid credentials without querying admin access", async () => {
    const client = authClient({
      signInResult: {
        data: { user: null },
        error: { code: "invalid_credentials", name: "AuthApiError", status: 400 },
      },
    })
    vi.mocked(createClient).mockResolvedValue(client as never)

    const result = await login(undefined, credentials())

    expect(result).toEqual({
      status: "error",
      error: "E-mail ou senha incorretos. Confira os dados e tente novamente.",
    })
    expect(client.from).not.toHaveBeenCalled()
  })

  it("reports a connection failure when authentication cannot reach the service", async () => {
    const client = authClient({
      signInResult: {
        data: { user: null },
        error: { name: "AuthRetryableFetchError", status: 0 },
      },
    })
    vi.mocked(createClient).mockResolvedValue(client as never)

    const result = await login(undefined, credentials())

    expect(result).toEqual({
      status: "error",
      error: "Não foi possível conectar ao serviço de autenticação. Verifique sua conexão e tente novamente.",
    })
  })

  it("clears the session and reports when the account is not an admin", async () => {
    const client = authClient({
      signInResult: { data: { user: { id: "user-1" } }, error: null },
      adminResult: { data: null, error: null },
    })
    vi.mocked(createClient).mockResolvedValue(client as never)

    const result = await login(undefined, credentials())

    expect(result).toEqual({
      status: "error",
      error: "Esta conta não possui acesso ao painel administrativo.",
    })
    expect(client.signOut).toHaveBeenCalledWith({ scope: "local" })
  })
})
