import { describe, expect, it, vi } from "vitest"

import { fetchContract } from "./fetch-contract"

function mockClient(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const eq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  return { from, select, eq, single }
}

const contractRow = {
  id: "contract-1",
  lead_id: "lead-1",
  service_types: ["site"],
  amount: 1000,
  hours: null,
  file_object_path: "abc.bin",
  created_by: "admin-1",
  created_at: "2026-01-01T00:00:00Z",
}

describe("fetchContract", () => {
  it("returns the row when found", async () => {
    const { from, eq } = mockClient({ data: contractRow, error: null })
    const supabase = { from } as never

    const result = await fetchContract(supabase, "contract-1")

    expect(result).toEqual(contractRow)
    expect(from).toHaveBeenCalledWith("contracts")
    expect(eq).toHaveBeenCalledWith("id", "contract-1")
  })

  it("returns null on not-found (PGRST116), without logging an error", async () => {
    const { from } = mockClient({ data: null, error: { code: "PGRST116", message: "no rows" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await fetchContract(supabase, "missing-id")

    expect(result).toBeNull()
    expect(consoleSpy).not.toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("returns null and logs on an unexpected error", async () => {
    const { from } = mockClient({ data: null, error: { code: "50000", message: "boom" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await fetchContract(supabase, "contract-1")

    expect(result).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })
})
