import { beforeEach, describe, expect, it, vi } from "vitest"

import type { CurrentAdmin } from "@/lib/auth/get-current-admin"
import { createAdminClient } from "@/lib/supabase/admin"

import { getFinancialCharts } from "./get-financial-charts"

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

beforeEach(() => {
  vi.mocked(createAdminClient).mockReset()
})

const superAdmin: CurrentAdmin = { id: "admin-1", role: "super_admin", name: "A" }
const employer: CurrentAdmin = { id: "admin-2", role: "employer", name: "B" }

function mockTransactionsClient(pages: { data: unknown[] | null; error: unknown }[]) {
  const range = vi.fn()
  for (const page of pages) range.mockResolvedValueOnce(page)
  const orderId = vi.fn().mockReturnValue({ range })
  const orderOccurredAt = vi.fn().mockReturnValue({ order: orderId })
  const lte = vi.fn().mockReturnValue({ order: orderOccurredAt })
  const gte = vi.fn().mockReturnValue({ lte })
  const select = vi.fn().mockReturnValue({ gte })
  const from = vi.fn().mockReturnValue({ select })
  return { from, select, gte, lte, range }
}

function mockAdminClient(result: { data: unknown[] | null; error: unknown }) {
  const inFn = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ in: inFn })
  const from = vi.fn().mockReturnValue({ select })
  return { from, select, in: inFn }
}

describe("getFinancialCharts", () => {
  it("groups income vs expense by month, zero-filling months with no activity", async () => {
    const rows = [
      { direction: "entrada", amount: 100, occurred_at: "2026-01-05", category: "receita", partner_id: null },
      { direction: "saida", amount: 40, occurred_at: "2026-01-10", category: "ferramentas", partner_id: null },
      { direction: "entrada", amount: 50, occurred_at: "2026-03-01", category: "receita", partner_id: null },
    ]
    const { from: transactionsFrom } = mockTransactionsClient([{ data: rows, error: null }])
    const supabase = { from: transactionsFrom } as never

    const result = await getFinancialCharts(supabase, superAdmin, { from: "2026-01-01", to: "2026-03-31" })

    expect(result.incomeExpenseByMonth).toEqual([
      { month: "2026-01", income: 100, expense: 40 },
      { month: "2026-02", income: 0, expense: 0 },
      { month: "2026-03", income: 50, expense: 0 },
    ])
  })

  it("groups expense by category, ignoring income rows", async () => {
    const rows = [
      { direction: "saida", amount: 40, occurred_at: "2026-01-10", category: "ferramentas", partner_id: null },
      { direction: "saida", amount: 60, occurred_at: "2026-01-11", category: "ferramentas", partner_id: null },
      { direction: "saida", amount: 20, occurred_at: "2026-01-12", category: "marketing", partner_id: null },
      { direction: "entrada", amount: 500, occurred_at: "2026-01-01", category: "receita", partner_id: null },
    ]
    const { from: transactionsFrom } = mockTransactionsClient([{ data: rows, error: null }])
    const supabase = { from: transactionsFrom } as never

    const result = await getFinancialCharts(supabase, superAdmin, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.expenseByCategory).toEqual([
      { category: "ferramentas", amount: 100 },
      { category: "marketing", amount: 20 },
    ])
  })

  it("sums a partner's contribution across both directions (an expense they personally covered still counts)", async () => {
    const rows = [
      { direction: "entrada", amount: 1000, occurred_at: "2026-01-05", category: "aporte", partner_id: "partner-1" },
      { direction: "saida", amount: 200, occurred_at: "2026-01-06", category: "equipamento", partner_id: "partner-1" },
      { direction: "entrada", amount: 300, occurred_at: "2026-01-07", category: "aporte", partner_id: "partner-2" },
      { direction: "saida", amount: 50, occurred_at: "2026-01-08", category: "marketing", partner_id: null },
    ]
    const { from: transactionsFrom } = mockTransactionsClient([{ data: rows, error: null }])
    const supabase = { from: transactionsFrom } as never

    const adminClient = mockAdminClient({
      data: [
        { user_id: "partner-1", name: "Ana" },
        { user_id: "partner-2", name: "Bruno" },
      ],
      error: null,
    })
    vi.mocked(createAdminClient).mockReturnValue(adminClient as never)

    const result = await getFinancialCharts(supabase, superAdmin, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.contributionByPartner).toEqual([
      { partnerId: "partner-1", partnerName: "Ana", amount: 1200 },
      { partnerId: "partner-2", partnerName: "Bruno", amount: 300 },
    ])
    expect(adminClient.in).toHaveBeenCalledWith("user_id", ["partner-1", "partner-2"])
  })

  it("never queries the admin client when no transaction has a partner_id", async () => {
    const rows = [{ direction: "saida", amount: 50, occurred_at: "2026-01-08", category: "marketing", partner_id: null }]
    const { from: transactionsFrom } = mockTransactionsClient([{ data: rows, error: null }])
    const supabase = { from: transactionsFrom } as never

    await getFinancialCharts(supabase, superAdmin, { from: "2026-01-01", to: "2026-01-31" })

    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it("never queries the admin client for a non-super_admin caller, even with partner_id rows present", async () => {
    const rows = [
      { direction: "entrada", amount: 100, occurred_at: "2026-01-05", category: "aporte", partner_id: "partner-1" },
    ]
    const { from: transactionsFrom } = mockTransactionsClient([{ data: rows, error: null }])
    const supabase = { from: transactionsFrom } as never

    const result = await getFinancialCharts(supabase, employer, { from: "2026-01-01", to: "2026-01-31" })

    expect(createAdminClient).not.toHaveBeenCalled()
    expect(result.contributionByPartner).toEqual([{ partnerId: "partner-1", partnerName: null, amount: 100 }])
  })

  it("falls back to a null partner name when the admin lookup fails", async () => {
    const rows = [
      { direction: "entrada", amount: 100, occurred_at: "2026-01-05", category: "aporte", partner_id: "partner-1" },
    ]
    const { from: transactionsFrom } = mockTransactionsClient([{ data: rows, error: null }])
    const supabase = { from: transactionsFrom } as never
    vi.mocked(createAdminClient).mockReturnValue(
      mockAdminClient({ data: null, error: { message: "boom" } }) as never
    )
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await getFinancialCharts(supabase, superAdmin, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.contributionByPartner).toEqual([{ partnerId: "partner-1", partnerName: null, amount: 100 }])
    consoleSpy.mockRestore()
  })

  it("returns a zero-filled month and empty category/partner data when there are no transactions", async () => {
    const { from: transactionsFrom } = mockTransactionsClient([{ data: [], error: null }])
    const supabase = { from: transactionsFrom } as never

    const result = await getFinancialCharts(supabase, superAdmin, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.incomeExpenseByMonth).toEqual([{ month: "2026-01", income: 0, expense: 0 }])
    expect(result.expenseByCategory).toEqual([])
    expect(result.contributionByPartner).toEqual([])
  })
})
