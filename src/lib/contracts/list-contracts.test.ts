import { beforeEach, describe, expect, it, vi } from "vitest"

import type { CurrentAdmin } from "@/lib/auth/get-current-admin"
import { createAdminClient } from "@/lib/supabase/admin"

import { listContracts } from "./list-contracts"

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(createAdminClient).mockReset()
  vi.mocked(createAdminClient).mockReturnValue(mockAdminClient({ data: [], error: null }) as never)
})

const superAdmin: CurrentAdmin = { id: "admin-1", role: "super_admin", name: "Super" }
const employer: CurrentAdmin = { id: "admin-2", role: "employer", name: "Employer" }

function contractRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "contract-1",
    lead_id: "lead-1",
    service_types: ["site"],
    amount: 1000,
    hours: null,
    file_object_path: null,
    created_by: "creator-1",
    created_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function mockSupabase(
  contractsResult: { data: unknown[] | null; error: unknown; count: number | null },
  leadsResult: { data: unknown[] | null; error: unknown } = { data: [], error: null }
) {
  const range = vi.fn().mockResolvedValue(contractsResult)
  const order = vi.fn().mockReturnValue({ range })
  const contractsSelect = vi.fn().mockReturnValue({ order })

  const leadsIn = vi.fn().mockResolvedValue(leadsResult)
  const leadsSelect = vi.fn().mockReturnValue({ in: leadsIn })

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "contracts") return { select: contractsSelect }
    if (table === "leads") return { select: leadsSelect }
    throw new Error(`unexpected table ${table}`)
  })

  return { from, range, order, leadsIn, leadsSelect }
}

function mockAdminClient(result: { data: unknown[] | null; error: unknown }) {
  const inFn = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ in: inFn })
  const from = vi.fn().mockReturnValue({ select })
  return { from, select, in: inFn }
}

describe("listContracts", () => {
  it("returns correct page slice and total across pages", async () => {
    const { from, range } = mockSupabase({ data: [contractRow()], error: null, count: 25 })
    const supabase = { from } as never

    const result = await listContracts(supabase, superAdmin, { page: 2, page_size: 20 })

    expect(range).toHaveBeenCalledWith(20, 39)
    expect(result.total).toBe(25)
    expect(result.page).toBe(2)
    expect(result.pageSize).toBe(20)
  })

  it("returns empty contracts and total 0 when there are no contracts", async () => {
    const { from } = mockSupabase({ data: [], error: null, count: 0 })
    const supabase = { from } as never

    const result = await listContracts(supabase, superAdmin, { page: 1, page_size: 20 })

    expect(result).toEqual({ contracts: [], total: 0, page: 1, pageSize: 20 })
  })

  it("maps a contract with no file to has_file: false and drops file_object_path", async () => {
    const { from } = mockSupabase({
      data: [contractRow({ file_object_path: null })],
      error: null,
      count: 1,
    })
    const supabase = { from } as never

    const result = await listContracts(supabase, superAdmin, { page: 1, page_size: 20 })

    expect(result.contracts[0]!.has_file).toBe(false)
    expect(result.contracts[0]).not.toHaveProperty("file_object_path")
  })

  it("maps a contract with a file to has_file: true without exposing the path", async () => {
    const { from } = mockSupabase({
      data: [contractRow({ file_object_path: "abc-123.bin" })],
      error: null,
      count: 1,
    })
    const supabase = { from } as never

    const result = await listContracts(supabase, superAdmin, { page: 1, page_size: 20 })

    expect(result.contracts[0]!.has_file).toBe(true)
    expect(result.contracts[0]).not.toHaveProperty("file_object_path")
  })

  it("batches one admin_users lookup for all distinct created_by ids on the page", async () => {
    const { from } = mockSupabase({
      data: [
        contractRow({ id: "c1", created_by: "creator-1" }),
        contractRow({ id: "c2", created_by: "creator-1" }),
        contractRow({ id: "c3", created_by: "creator-2" }),
      ],
      error: null,
      count: 3,
    })
    const supabase = { from } as never
    const adminClient = mockAdminClient({
      data: [
        { user_id: "creator-1", name: "Ana" },
        { user_id: "creator-2", name: "Bruno" },
      ],
      error: null,
    })
    vi.mocked(createAdminClient).mockReturnValue(adminClient as never)

    const result = await listContracts(supabase, superAdmin, { page: 1, page_size: 20 })

    expect(adminClient.in).toHaveBeenCalledTimes(1)
    expect(adminClient.in).toHaveBeenCalledWith("user_id", ["creator-1", "creator-2"])
    expect(result.contracts.map((c) => c.created_by_name)).toEqual(["Ana", "Ana", "Bruno"])
  })

  it("never queries admin_users and resolves creator name to null for a non-super_admin caller", async () => {
    const { from } = mockSupabase({ data: [contractRow()], error: null, count: 1 })
    const supabase = { from } as never

    const result = await listContracts(supabase, employer, { page: 1, page_size: 20 })

    expect(createAdminClient).not.toHaveBeenCalled()
    expect(result.contracts[0]!.created_by_name).toBeNull()
  })

  it("throws a generic error and logs when the contracts query fails", async () => {
    const { from } = mockSupabase({ data: null, error: { message: "db down" }, count: null })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(listContracts(supabase, superAdmin, { page: 1, page_size: 20 })).rejects.toThrow(
      "Não foi possível carregar os contratos."
    )

    consoleSpy.mockRestore()
  })

  it("falls back to null lead names and logs when the leads .in() lookup errors", async () => {
    const { from } = mockSupabase(
      { data: [contractRow({ lead_id: "lead-1" })], error: null, count: 1 },
      { data: null, error: { message: "leads down" } }
    )
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await listContracts(supabase, superAdmin, { page: 1, page_size: 20 })

    expect(result.contracts[0]!.lead_name).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("falls back to null creator names and logs when the admin_users lookup errors", async () => {
    const { from } = mockSupabase({ data: [contractRow({ created_by: "creator-1" })], error: null, count: 1 })
    const supabase = { from } as never
    vi.mocked(createAdminClient).mockReturnValue(
      mockAdminClient({ data: null, error: { message: "admin_users down" } }) as never
    )
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await listContracts(supabase, superAdmin, { page: 1, page_size: 20 })

    expect(result.contracts[0]!.created_by_name).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("returns an empty page with the true total when paging past the last page", async () => {
    const { from, range } = mockSupabase({ data: [], error: null, count: 3 })
    const supabase = { from } as never

    const result = await listContracts(supabase, superAdmin, { page: 999, page_size: 20 })

    expect(range).toHaveBeenCalledWith(19960, 19979)
    expect(result).toEqual({ contracts: [], total: 3, page: 999, pageSize: 20 })
  })

  it("resolves lead names via a batched .in() lookup", async () => {
    const { from, leadsIn } = mockSupabase(
      { data: [contractRow({ lead_id: "lead-1" })], error: null, count: 1 },
      { data: [{ id: "lead-1", name: "Cliente X" }], error: null }
    )
    const supabase = { from } as never

    const result = await listContracts(supabase, superAdmin, { page: 1, page_size: 20 })

    expect(leadsIn).toHaveBeenCalledWith("id", ["lead-1"])
    expect(result.contracts[0]!.lead_name).toBe("Cliente X")
  })
})
