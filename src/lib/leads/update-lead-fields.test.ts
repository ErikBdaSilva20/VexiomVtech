import { describe, expect, it } from "vitest"
import { vi } from "vitest"

import { updateLeadFields } from "./update-lead-fields"

function mockClient(result: { data: { id: string } | null; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const eq = vi.fn().mockReturnValue({ select })
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ update })

  return { from, update, eq }
}

describe("updateLeadFields", () => {
  it("returns ok on a successful update", async () => {
    const { from, update, eq } = mockClient({ data: { id: "lead-1" }, error: null })
    const supabase = { from } as never

    const result = await updateLeadFields(supabase, "lead-1", { probability: "alta" })

    expect(result).toEqual({ ok: true })
    expect(update).toHaveBeenCalledWith({ probability: "alta" })
    expect(eq).toHaveBeenCalledWith("id", "lead-1")
  })

  it("returns not-ok with the error when the update fails", async () => {
    const dbError = { message: "db down" }
    const { from } = mockClient({ data: null, error: dbError })
    const supabase = { from } as never

    const result = await updateLeadFields(supabase, "lead-1", { probability: "alta" })

    expect(result).toEqual({ ok: false, error: dbError })
  })

  it("returns not-ok when no row matches, even without an explicit error", async () => {
    const { from } = mockClient({ data: null, error: null })
    const supabase = { from } as never

    const result = await updateLeadFields(supabase, "missing-lead", { probability: "alta" })

    expect(result.ok).toBe(false)
  })
})
