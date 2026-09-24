import { describe, expect, it, vi } from "vitest"

import { getProjectProfit } from "./get-project-profit"

function mockClient(pages: { data: unknown[] | null; error: unknown }[]) {
  const range = vi.fn()
  for (const page of pages) range.mockResolvedValueOnce(page)
  const order = vi.fn().mockReturnValue({ range })
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return { from, select, eq, order, range }
}

describe("getProjectProfit", () => {
  it("sums income minus expense for the project's transactions", async () => {
    const rows = [
      { direction: "entrada", amount: 5000 },
      { direction: "entrada", amount: 1000 },
      { direction: "saida", amount: 2000 },
    ]
    const { from } = mockClient([{ data: rows, error: null }])
    const supabase = { from } as never

    const result = await getProjectProfit(supabase, "project-1")

    expect(result).toEqual({ projectId: "project-1", income: 6000, expense: 2000, profit: 4000 })
  })

  it("returns zero on every field when the project has no linked transactions, without error", async () => {
    const { from } = mockClient([{ data: [], error: null }])
    const supabase = { from } as never

    const result = await getProjectProfit(supabase, "project-1")

    expect(result).toEqual({ projectId: "project-1", income: 0, expense: 0, profit: 0 })
  })

  it("returns a negative profit when expenses exceed income", async () => {
    const rows = [
      { direction: "entrada", amount: 100 },
      { direction: "saida", amount: 400 },
    ]
    const { from } = mockClient([{ data: rows, error: null }])
    const supabase = { from } as never

    const result = await getProjectProfit(supabase, "project-1")

    expect(result.profit).toBe(-300)
  })

  it("sums without float drift across many fractional-cent-prone values", async () => {
    const rows = Array.from({ length: 10 }, () => ({ direction: "entrada" as const, amount: 0.1 }))
    const { from } = mockClient([{ data: rows, error: null }])
    const supabase = { from } as never

    const result = await getProjectProfit(supabase, "project-1")

    expect(result.income).toBe(1)
  })

  it("propagates the shared fetch error when the query fails", async () => {
    const { from } = mockClient([{ data: null, error: { message: "boom" } }])
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(getProjectProfit(supabase, "project-1")).rejects.toThrow(
      "Não foi possível carregar os lançamentos financeiros."
    )
    consoleSpy.mockRestore()
  })
})
