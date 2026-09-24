import { describe, expect, it, vi } from "vitest"

import { listLeadInteractions } from "./list-lead-interactions"

function mockClient(result: { data: unknown[] | null; error: unknown }) {
  const order = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return { from, select, eq, order }
}

describe("listLeadInteractions", () => {
  it("returns interactions ordered chronologically (ascending)", async () => {
    const rows = [{ id: "int-1" }, { id: "int-2" }]
    const { from, eq, order } = mockClient({ data: rows, error: null })
    const supabase = { from } as never

    const result = await listLeadInteractions(supabase, "lead-1")

    expect(result).toEqual(rows)
    expect(eq).toHaveBeenCalledWith("lead_id", "lead-1")
    expect(order).toHaveBeenCalledWith("occurred_at", { ascending: true })
  })

  it("returns an empty array when there is no data", async () => {
    const { from } = mockClient({ data: null, error: null })
    const supabase = { from } as never

    const result = await listLeadInteractions(supabase, "lead-1")

    expect(result).toEqual([])
  })

  it("throws a generic error and logs when the query fails", async () => {
    const { from } = mockClient({ data: null, error: { message: "db down" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(listLeadInteractions(supabase, "lead-1")).rejects.toThrow(
      "Não foi possível carregar o histórico do lead."
    )

    consoleSpy.mockRestore()
  })
})
