import { describe, expect, it, vi } from "vitest"

import { createTransaction } from "./create-transaction"
import type { CreateTransactionInput } from "./transaction-schema"

function mockClient(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  const from = vi.fn().mockReturnValue({ insert })
  return { from, insert, select, single }
}

const input: CreateTransactionInput = {
  direction: "entrada",
  category: "Receita de projeto",
  amount: 1500.5,
  occurred_at: "2026-01-15",
  description: "Pagamento do projeto X",
  project_id: null,
  partner_id: null,
}

describe("createTransaction", () => {
  it("inserts with the caller's admin id as created_by", async () => {
    const { from, insert } = mockClient({ data: { id: "transaction-1" }, error: null })
    const supabase = { from } as never

    const result = await createTransaction(supabase, input, "admin-1")

    expect(result).toEqual({ ok: true, id: "transaction-1" })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ created_by: "admin-1" }))
  })

  it("never lets input override created_by", async () => {
    const { from, insert } = mockClient({ data: { id: "transaction-1" }, error: null })
    const supabase = { from } as never

    await createTransaction(supabase, { ...input, created_by: "someone-else" } as never, "admin-1")

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ created_by: "admin-1" }))
  })

  it("returns invalid_reference on a foreign key violation", async () => {
    const { from } = mockClient({ data: null, error: { code: "23503" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createTransaction(supabase, input, "admin-1")

    expect(result).toEqual({ ok: false, error: "invalid_reference" })
    consoleSpy.mockRestore()
  })

  it("returns invalid_amount on a check violation", async () => {
    const { from } = mockClient({ data: null, error: { code: "23514" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createTransaction(supabase, input, "admin-1")

    expect(result).toEqual({ ok: false, error: "invalid_amount" })
    consoleSpy.mockRestore()
  })

  it("returns unknown on any other error", async () => {
    const { from } = mockClient({ data: null, error: { code: "99999" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createTransaction(supabase, input, "admin-1")

    expect(result).toEqual({ ok: false, error: "unknown" })
    consoleSpy.mockRestore()
  })
})
