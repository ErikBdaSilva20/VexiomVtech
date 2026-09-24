import { describe, expect, it, vi } from "vitest"

import { markLeadViewed } from "./mark-lead-viewed"

function mockClient(error: unknown = null) {
  const is = vi.fn().mockResolvedValue({ error })
  const eq = vi.fn().mockReturnValue({ is })
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ update })

  return { from, update, eq, is }
}

describe("markLeadViewed", () => {
  it("issues a conditional update guarded by viewed_at IS NULL", async () => {
    const { from, update, eq, is } = mockClient()
    const supabase = { from } as never

    await markLeadViewed(supabase, "lead-1")

    expect(from).toHaveBeenCalledWith("leads")
    expect(update).toHaveBeenCalledWith({ viewed_at: expect.any(String) })
    expect(eq).toHaveBeenCalledWith("id", "lead-1")
    expect(is).toHaveBeenCalledWith("viewed_at", null)
  })

  it("does not throw when the update fails — it only logs", async () => {
    const { from } = mockClient({ message: "db down" })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(markLeadViewed(supabase, "lead-1")).resolves.toBeUndefined()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })
})
