import { describe, expect, it, vi } from "vitest"

import { fetchTransactionsForProject } from "./fetch-transactions-for-project"

function mockClient(pages: { data: unknown[] | null; error: unknown }[]) {
  const range = vi.fn()
  for (const page of pages) range.mockResolvedValueOnce(page)
  const order = vi.fn().mockReturnValue({ range })
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return { from, select, eq, order, range }
}

describe("fetchTransactionsForProject", () => {
  it("filters by project_id, with no date bounds", async () => {
    const { from, eq } = mockClient([{ data: [], error: null }])
    const supabase = { from } as never

    await fetchTransactionsForProject(supabase, "project-1")

    expect(eq).toHaveBeenCalledWith("project_id", "project-1")
  })

  it("returns rows unmodified when under the page size", async () => {
    const rows = [{ direction: "entrada", amount: 100 }]
    const { from } = mockClient([{ data: rows, error: null }])
    const supabase = { from } as never

    const result = await fetchTransactionsForProject(supabase, "project-1")

    expect(result).toEqual(rows)
  })

  it("paginates until a short page is returned", async () => {
    const fullPage = Array.from({ length: 1000 }, () => ({ direction: "entrada", amount: 1 }))
    const lastPage = [{ direction: "saida", amount: 5 }]
    const { from, range } = mockClient([
      { data: fullPage, error: null },
      { data: lastPage, error: null },
    ])
    const supabase = { from } as never

    const result = await fetchTransactionsForProject(supabase, "project-1")

    expect(result).toHaveLength(1001)
    expect(range).toHaveBeenCalledTimes(2)
  })

  it("preserves both directions within a single page", async () => {
    const mixedPage = [
      { direction: "entrada", amount: 100 },
      { direction: "saida", amount: 40 },
      { direction: "entrada", amount: 25 },
    ]
    const { from } = mockClient([{ data: mixedPage, error: null }])
    const supabase = { from } as never

    const result = await fetchTransactionsForProject(supabase, "project-1")

    expect(result).toEqual(mixedPage)
  })

  it("throws a user-facing error when the query fails", async () => {
    const { from } = mockClient([{ data: null, error: { message: "boom" } }])
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(fetchTransactionsForProject(supabase, "project-1")).rejects.toThrow(
      "Não foi possível carregar os lançamentos financeiros."
    )
    consoleSpy.mockRestore()
  })
})
