import { describe, expect, it, vi } from "vitest"

import { getProspectingOverview } from "./get-prospecting-overview"

function mockClient(result: { data: unknown[] | null; error: unknown }) {
  const lt = vi.fn().mockResolvedValue(result)
  const gte = vi.fn().mockReturnValue({ lt })
  const select = vi.fn().mockReturnValue({ gte })
  const from = vi.fn().mockReturnValue({ select })

  return { from, select, gte, lt }
}

describe("getProspectingOverview", () => {
  it("defaults to a 12-month window ending today when no period is given", async () => {
    const { from, gte, lt } = mockClient({ data: [], error: null })
    const supabase = { from } as never

    const result = await getProspectingOverview(supabase, {})

    const today = new Date().toISOString().slice(0, 10)
    expect(result.to).toBe(today)
    expect(gte).toHaveBeenCalledWith("created_at", result.from)
    expect(lt).toHaveBeenCalledWith("created_at", `${today}T23:59:59.999Z`)
  })

  it("uses the explicit from/to bounds when given", async () => {
    const { from } = mockClient({ data: [], error: null })
    const supabase = { from } as never

    const result = await getProspectingOverview(supabase, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.from).toBe("2026-01-01")
    expect(result.to).toBe("2026-01-31")
  })

  it("aggregates funnel counts, conversion rate, project type distribution and volume by month", async () => {
    const rows = [
      { status: "novo_lead", project_type: "landing_page", created_at: "2026-01-05T10:00:00Z" },
      { status: "novo_lead", project_type: "landing_page", created_at: "2026-01-20T10:00:00Z" },
      { status: "contrato_fechado", project_type: "ecommerce", created_at: "2026-02-01T10:00:00Z" },
      { status: "nao_convertido", project_type: "landing_page", created_at: "2026-02-10T10:00:00Z" },
    ]
    const { from } = mockClient({ data: rows, error: null })
    const supabase = { from } as never

    const result = await getProspectingOverview(supabase, { from: "2026-01-01", to: "2026-02-28" })

    expect(result.totalLeads).toBe(4)
    expect(result.funnel.novo_lead).toBe(2)
    expect(result.funnel.contrato_fechado).toBe(1)
    expect(result.funnel.nao_convertido).toBe(1)
    expect(result.funnel.em_analise).toBe(0)
    expect(result.conversionRate).toBe(0.25)
    expect(result.projectTypeDistribution).toEqual({ landing_page: 3, ecommerce: 1 })
    expect(result.volumeByMonth).toEqual([
      { month: "2026-01", count: 2 },
      { month: "2026-02", count: 2 },
    ])
  })

  it("returns a zeroed overview when there are no leads in the period", async () => {
    const { from } = mockClient({ data: [], error: null })
    const supabase = { from } as never

    const result = await getProspectingOverview(supabase, { from: "2026-01-01", to: "2026-01-31" })

    expect(result.totalLeads).toBe(0)
    expect(result.conversionRate).toBe(0)
    expect(result.volumeByMonth).toEqual([])
  })

  it("throws a generic error and logs when the query fails", async () => {
    const { from } = mockClient({ data: null, error: { message: "db down" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(getProspectingOverview(supabase, {})).rejects.toThrow(
      "Não foi possível carregar os indicadores da prospecção."
    )

    consoleSpy.mockRestore()
  })
})
