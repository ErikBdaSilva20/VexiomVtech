import { describe, expect, it, vi } from "vitest"

import { logContractAccess } from "./log-contract-access"

function mockClient(result: { error: unknown }) {
  const insert = vi.fn().mockResolvedValue(result)
  const from = vi.fn().mockReturnValue({ insert })
  return { from, insert }
}

describe("logContractAccess", () => {
  it("inserts a row with the given contract and admin ids", async () => {
    const { from, insert } = mockClient({ error: null })
    const supabase = { from } as never

    await logContractAccess(supabase, "contract-1", "admin-1")

    expect(from).toHaveBeenCalledWith("contract_access_log")
    expect(insert).toHaveBeenCalledWith({ contract_id: "contract-1", admin_id: "admin-1" })
  })

  it("throws when the insert fails, so the caller can apply its own fail-open handling", async () => {
    const { from } = mockClient({ error: { message: "boom" } })
    const supabase = { from } as never

    await expect(logContractAccess(supabase, "contract-1", "admin-1")).rejects.toBeTruthy()
  })
})
