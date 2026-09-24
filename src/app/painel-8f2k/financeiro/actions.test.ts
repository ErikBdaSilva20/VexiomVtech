import { beforeEach, describe, expect, it, vi } from "vitest"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createTransaction } from "@/lib/finance/create-transaction"

import { createTransactionAction } from "./actions"

vi.mock("@/lib/auth/get-current-admin", () => ({
  getCurrentAdmin: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/finance/create-transaction", () => ({
  createTransaction: vi.fn(),
}))

function validFormData(overrides: Record<string, string> = {}) {
  const data = new FormData()
  const fields: Record<string, string> = {
    direction: "entrada",
    category: "Receita de projeto",
    amount: "1500.50",
    occurred_at: "2026-01-15",
    description: "Pagamento do projeto X",
    ...overrides,
  }
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

beforeEach(() => {
  vi.mocked(getCurrentAdmin).mockReset()
  vi.mocked(createTransaction).mockReset()
})

describe("createTransactionAction", () => {
  it("rejects when there is no session", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await createTransactionAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "Sessão expirada. Faça login novamente." })
    expect(createTransaction).not.toHaveBeenCalled()
  })

  it("rejects a non-super_admin, even with a valid session (defense in depth alongside RLS)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await createTransactionAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "Apenas super_admin pode gerenciar o financeiro." })
    expect(createTransaction).not.toHaveBeenCalled()
  })

  it("returns field errors for an invalid payload", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })

    const result = await createTransactionAction(undefined, validFormData({ amount: "-10" }))

    expect(result?.status).toBe("error")
    expect(createTransaction).not.toHaveBeenCalled()
  })

  it("creates the transaction on a valid payload, passing the caller's own admin id", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createTransaction).mockResolvedValue({ ok: true, id: "transaction-1" })

    const result = await createTransactionAction(undefined, validFormData())

    expect(result).toEqual({ status: "success", id: "transaction-1" })
    expect(createTransaction).toHaveBeenCalledWith(expect.anything(), expect.anything(), "admin-1")
  })

  it("ignores a created_by field spoofed via FormData, always using the caller's own admin id", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createTransaction).mockResolvedValue({ ok: true, id: "transaction-1" })

    await createTransactionAction(undefined, validFormData({ created_by: "someone-else" }))

    expect(createTransaction).toHaveBeenCalledWith(expect.anything(), expect.anything(), "admin-1")
  })

  it("surfaces a specific message for an invalid reference", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createTransaction).mockResolvedValue({ ok: false, error: "invalid_reference" })

    const result = await createTransactionAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "O projeto ou sócio selecionado não existe." })
  })
})
