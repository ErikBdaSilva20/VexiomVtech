import { describe, expect, it, vi } from "vitest"

import { listLeadMeetings } from "./list-lead-meetings"

function mockClient(result: { data: unknown[] | null; error: unknown }) {
  const order = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })

  return { from, select, eq, order }
}

describe("listLeadMeetings", () => {
  it("returns meetings ordered chronologically (ascending) by scheduled_at", async () => {
    const rows = [{ id: "meeting-1" }, { id: "meeting-2" }]
    const { from, eq, order } = mockClient({ data: rows, error: null })
    const supabase = { from } as never

    const result = await listLeadMeetings(supabase, "lead-1")

    expect(result).toEqual(rows)
    expect(eq).toHaveBeenCalledWith("lead_id", "lead-1")
    expect(order).toHaveBeenCalledWith("scheduled_at", { ascending: true })
  })

  it("returns an empty array when there is no data", async () => {
    const { from } = mockClient({ data: null, error: null })
    const supabase = { from } as never

    const result = await listLeadMeetings(supabase, "lead-1")

    expect(result).toEqual([])
  })

  it("throws a generic error and logs when the query fails", async () => {
    const { from } = mockClient({ data: null, error: { message: "db down" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(listLeadMeetings(supabase, "lead-1")).rejects.toThrow(
      "Não foi possível carregar as reuniões do lead."
    )

    consoleSpy.mockRestore()
  })
})
