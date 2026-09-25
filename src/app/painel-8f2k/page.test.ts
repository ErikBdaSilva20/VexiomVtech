import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { LEAD_STATUSES } from "@/lib/leads/lead-status"

vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("redirect should not be called in this test")
  }),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/auth/get-current-admin", () => ({
  getCurrentAdmin: vi.fn(),
}))

vi.mock("@/lib/leads/get-prospecting-overview", () => ({
  getProspectingOverview: vi.fn(),
}))

vi.mock("@/lib/finance/get-financial-balance", () => ({
  getFinancialBalance: vi.fn(),
}))

vi.mock("@/lib/finance/get-financial-charts", () => ({
  getFinancialCharts: vi.fn(),
}))

vi.mock("@/lib/contracts/list-contracts", () => ({
  listContracts: vi.fn(),
}))

const { getCurrentAdmin } = await import("@/lib/auth/get-current-admin")
const { getProspectingOverview } = await import("@/lib/leads/get-prospecting-overview")
const { getFinancialBalance } = await import("@/lib/finance/get-financial-balance")
const { getFinancialCharts } = await import("@/lib/finance/get-financial-charts")
const { listContracts } = await import("@/lib/contracts/list-contracts")
const { default: PainelIndexPage } = await import("./page")

function emptyFunnel() {
  return Object.fromEntries(LEAD_STATUSES.map((status) => [status, 0])) as Record<string, number>
}

const overview = {
  from: "2026-01-01",
  to: "2026-09-24",
  totalLeads: 1,
  funnel: emptyFunnel(),
  conversionRate: 0,
  projectTypeDistribution: {},
  volumeByMonth: [],
}

beforeEach(() => {
  vi.mocked(getProspectingOverview).mockResolvedValue(overview)
  vi.mocked(getFinancialBalance).mockResolvedValue({ from: "", to: "", income: 0, expense: 0, balance: 0 })
  vi.mocked(getFinancialCharts).mockResolvedValue({
    from: "",
    to: "",
    incomeExpenseByMonth: [],
    expenseByCategory: [],
    contributionByPartner: [],
  })
  vi.mocked(listContracts).mockResolvedValue({ contracts: [], total: 0, page: 1, pageSize: 1 })
})

describe("PainelIndexPage role gating", () => {
  it("omits financeiro/contratos sections and never calls their data sources for an employer", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "a1", role: "employer", name: "Empregador" })

    const html = renderToStaticMarkup(await PainelIndexPage())

    expect(html).not.toContain("financial-section-title")
    expect(html).not.toContain("contracts-section-title")
    expect(getFinancialBalance).not.toHaveBeenCalled()
    expect(getFinancialCharts).not.toHaveBeenCalled()
    expect(listContracts).not.toHaveBeenCalled()
  })

  it("renders financeiro/contratos sections and calls their data sources for a super_admin", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "a2", role: "super_admin", name: "Admin" })

    const html = renderToStaticMarkup(await PainelIndexPage())

    expect(html).toContain("financial-section-title")
    expect(html).toContain("contracts-section-title")
    expect(getFinancialBalance).toHaveBeenCalledTimes(1)
    expect(getFinancialCharts).toHaveBeenCalledTimes(1)
    expect(listContracts).toHaveBeenCalledTimes(1)
  })
})
