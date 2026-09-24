import { describe, expect, it, vi } from "vitest"

import { fetchTransactionsInPeriod } from "./fetch-transactions-in-period"

function mockClient(pages: { data: unknown[] | null; error: unknown }[]) {
  const range = vi.fn()
  for (const page of pages) range.mockResolvedValueOnce(page)
  const orderId = vi.fn().mockReturnValue({ range })
  const orderOccurredAt = vi.fn().mockReturnValue({ order: orderId })
  const lte = vi.fn().mockReturnValue({ order: orderOccurredAt })
  const gte = vi.fn().mockReturnValue({ lte })
  const select = vi.fn().mockReturnValue({ gte })
  const from = vi.fn().mockReturnValue({ select })

  return { from, select, gte, lte, orderOccurredAt, orderId, range }
}

describe("fetchTransactionsInPeriod", () => {
  it("queries the given period bounds", async () => {
    const { from, gte, lte } = mockClient([{ data: [], error: null }])
    const supabase = { from } as never

    await fetchTransactionsInPeriod(supabase, "2026-01-01", "2026-01-31")

    expect(gte).toHaveBeenCalledWith("occurred_at", "2026-01-01")
    expect(lte).toHaveBeenCalledWith("occurred_at", "2026-01-31")
  })

  it("orders by occurred_at then id for stable pagination", async () => {
    const { from, orderOccurredAt, orderId } = mockClient([{ data: [], error: null }])
    const supabase = { from } as never

    await fetchTransactionsInPeriod(supabase, "2026-01-01", "2026-01-31")

    expect(orderOccurredAt).toHaveBeenCalledWith("occurred_at", { ascending: true })
    expect(orderId).toHaveBeenCalledWith("id", { ascending: true })
  })

  it("returns a single page unmodified when under the page size", async () => {
    const rows = [{ direction: "entrada", amount: 100, occurred_at: "2026-01-05", category: "x", partner_id: null }]
    const { from } = mockClient([{ data: rows, error: null }])
    const supabase = { from } as never

    const result = await fetchTransactionsInPeriod(supabase, "2026-01-01", "2026-01-31")

    expect(result).toEqual(rows)
  })

  it("paginates until a short page is returned", async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({
      direction: "entrada",
      amount: 1,
      occurred_at: "2026-01-05",
      category: "x",
      partner_id: null,
      i,
    }))
    const lastPage = [{ direction: "saida", amount: 5, occurred_at: "2026-01-06", category: "y", partner_id: null }]
    const { from, range } = mockClient([
      { data: fullPage, error: null },
      { data: lastPage, error: null },
    ])
    const supabase = { from } as never

    const result = await fetchTransactionsInPeriod(supabase, "2026-01-01", "2026-01-31")

    expect(result).toHaveLength(1001)
    expect(range).toHaveBeenNthCalledWith(1, 0, 999)
    expect(range).toHaveBeenNthCalledWith(2, 1000, 1999)
  })

  it("throws a user-facing error when the query fails", async () => {
    const { from } = mockClient([{ data: null, error: { message: "boom" } }])
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(fetchTransactionsInPeriod(supabase, "2026-01-01", "2026-01-31")).rejects.toThrow(
      "Não foi possível carregar os lançamentos financeiros."
    )
    consoleSpy.mockRestore()
  })
})
