import { describe, expect, it, vi } from "vitest"

import { getFinancialBalance } from "./get-financial-balance"
import { localDateString } from "@/lib/leads/sao-paulo-time"

function mockClient(pages: { data: unknown[] | null; error: unknown }[]) {
  const range = vi.fn()
  for (const page of pages) range.mockResolvedValueOnce(page)
  const lte = vi.fn().mockReturnValue({ range })
  const gte = vi.fn().mockReturnValue({ lte })
  const select = vi.fn().mockReturnValue({ gte })
  const from = vi.fn().mockReturnValue({ select })

  return { from, select, gte, lte, range }
}

describe("getFinancialBalance", () => {
  it("defaults to the current calendar month (1st through today) when no period is given", async () => {
    const { from, gte, lte } = mockClient([{ data: [], error: null }])
    const supabase = { from } as never

    const result = await getFinancialBalance(supabase, {})

    const today = localDateString(new Date())
    const [year, month] = today.split("-")
    expect(result.from).toBe(`${year}-${month}-01`)
    expect(result.to).toBe(today)
    expect(gte).toHaveBeenCalledWith("occurred_at", result.from)
    expect(lte).toHaveBeenCalledWith("occurred_at", result.to)
  })

  it("uses the explicit from/to bounds when both are given", async () => {
    const { from } = mockClient([{ data: [], error: null }])
    const supabase = { from } as never

    const result = await getFinancialBalance(supabase, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.from).toBe("2026-01-01")
    expect(result.to).toBe("2026-01-31")
  })

  it("defaults to (given day) through today when only from is given", async () => {
    const { from } = mockClient([{ data: [], error: null }])
    const supabase = { from } as never

    const result = await getFinancialBalance(supabase, { from: "2026-01-01" })

    expect(result.from).toBe("2026-01-01")
    expect(result.to).toBe(localDateString(new Date()))
  })

  it("defaults from to the 1st of to's month when only to is given", async () => {
    const { from } = mockClient([{ data: [], error: null }])
    const supabase = { from } as never

    const result = await getFinancialBalance(supabase, { to: "2026-03-15" })

    expect(result.from).toBe("2026-03-01")
    expect(result.to).toBe("2026-03-15")
  })

  it("sums income and expense separately and computes the balance", async () => {
    const rows = [
      { direction: "entrada", amount: 1500.5 },
      { direction: "entrada", amount: 200 },
      { direction: "saida", amount: 300.25 },
    ]
    const { from } = mockClient([{ data: rows, error: null }])
    const supabase = { from } as never

    const result = await getFinancialBalance(supabase, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.income).toBe(1700.5)
    expect(result.expense).toBe(300.25)
    expect(result.balance).toBe(1400.25)
  })

  it("returns a negative balance when expenses exceed income", async () => {
    const rows = [
      { direction: "entrada", amount: 100 },
      { direction: "saida", amount: 400 },
    ]
    const { from } = mockClient([{ data: rows, error: null }])
    const supabase = { from } as never

    const result = await getFinancialBalance(supabase, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.balance).toBe(-300)
  })

  it("returns a zero balance when there are no transactions", async () => {
    const { from } = mockClient([{ data: [], error: null }])
    const supabase = { from } as never

    const result = await getFinancialBalance(supabase, { from: "2026-01-01", to: "2026-01-31" })

    expect(result).toMatchObject({ income: 0, expense: 0, balance: 0 })
  })

  it("sums without float drift across many fractional-cent-prone values", async () => {
    const rows = Array.from({ length: 10 }, () => ({ direction: "entrada" as const, amount: 0.1 }))
    const { from } = mockClient([{ data: rows, error: null }])
    const supabase = { from } as never

    const result = await getFinancialBalance(supabase, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.income).toBe(1)
  })

  it("paginates past PostgREST's default row cap instead of silently truncating the sum", async () => {
    const fullPage = Array.from({ length: 1000 }, () => ({ direction: "entrada" as const, amount: 1 }))
    const lastPage = [{ direction: "entrada" as const, amount: 5 }]
    const { from, range } = mockClient([
      { data: fullPage, error: null },
      { data: lastPage, error: null },
    ])
    const supabase = { from } as never

    const result = await getFinancialBalance(supabase, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.income).toBe(1005)
    expect(range).toHaveBeenCalledTimes(2)
    expect(range).toHaveBeenNthCalledWith(1, 0, 999)
    expect(range).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it("throws a user-facing error when the query fails", async () => {
    const { from } = mockClient([{ data: null, error: { message: "boom" } }])
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(getFinancialBalance(supabase, {})).rejects.toThrow(
      "Não foi possível carregar o saldo financeiro."
    )
    consoleSpy.mockRestore()
  })
})
