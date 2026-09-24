import { describe, expect, it, vi } from "vitest"

import { listLeads } from "./list-leads"
import { listLeadsQuerySchema } from "./list-leads-schema"

function parseFilters(input: Record<string, unknown>) {
  const result = listLeadsQuerySchema.parse(input)
  return result
}

function mockQueryResult(result: { data: unknown[] | null; error: unknown; count: number | null }) {
  const calls: { or?: string; eq: [string, unknown][]; contains?: [string, unknown]; range?: [number, number] } = {
    eq: [],
  }

  const query = {
    or: vi.fn().mockImplementation((expr: string) => {
      calls.or = expr
      return query
    }),
    eq: vi.fn().mockImplementation((column: string, value: unknown) => {
      calls.eq.push([column, value])
      return query
    }),
    contains: vi.fn().mockImplementation((column: string, value: unknown) => {
      calls.contains = [column, value]
      return query
    }),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockImplementation((from: number, to: number) => {
      calls.range = [from, to]
      return Promise.resolve(result)
    }),
  }

  const select = vi.fn().mockReturnValue(query)
  const from = vi.fn().mockReturnValue({ select })

  return { from, select, query, calls }
}

describe("listLeads", () => {
  it("returns leads, total, page and pageSize on success", async () => {
    const { from } = mockQueryResult({ data: [{ id: "lead-1" }], error: null, count: 1 })
    const supabase = { from } as never

    const result = await listLeads(supabase, parseFilters({}))

    expect(result).toEqual({ leads: [{ id: "lead-1" }], total: 1, page: 1, pageSize: 20 })
  })

  it("applies range based on page and page_size", async () => {
    const { from, calls } = mockQueryResult({ data: [], error: null, count: 0 })
    const supabase = { from } as never

    await listLeads(supabase, parseFilters({ page: 3, page_size: 10 }))

    expect(calls.range).toEqual([20, 29])
  })

  it("builds an escaped or() filter across name/company/email/whatsapp when searching", async () => {
    const { from, calls } = mockQueryResult({ data: [], error: null, count: 0 })
    const supabase = { from } as never

    await listLeads(supabase, parseFilters({ search: "a,b" }))

    expect(calls.or).toBe(
      "name.ilike.%a\\,b%,company.ilike.%a\\,b%,email.ilike.%a\\,b%,whatsapp.ilike.%a\\,b%"
    )
  })

  it("does not call or() when there is no search term", async () => {
    const { from, query } = mockQueryResult({ data: [], error: null, count: 0 })
    const supabase = { from } as never

    await listLeads(supabase, parseFilters({}))

    expect(query.or).not.toHaveBeenCalled()
  })

  it("applies status, project_type and assigned_to as independent eq() calls", async () => {
    const { from, calls } = mockQueryResult({ data: [], error: null, count: 0 })
    const supabase = { from } as never

    await listLeads(
      supabase,
      parseFilters({
        status: "novo_lead",
        project_type: "site",
        assigned_to: "11111111-1111-4111-8111-111111111111",
      })
    )

    expect(calls.eq).toEqual(
      expect.arrayContaining([
        ["status", "novo_lead"],
        ["project_type", "site"],
        ["assigned_to", "11111111-1111-4111-8111-111111111111"],
      ])
    )
  })

  it("applies tag as a contains() filter", async () => {
    const { from, calls } = mockQueryResult({ data: [], error: null, count: 0 })
    const supabase = { from } as never

    await listLeads(supabase, parseFilters({ tag: "urgente" }))

    expect(calls.contains).toEqual(["tags", ["urgente"]])
  })

  it("throws a generic error and logs when the query fails", async () => {
    const { from } = mockQueryResult({ data: null, error: { message: "db down" }, count: null })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(listLeads(supabase, parseFilters({}))).rejects.toThrow(
      "Não foi possível carregar os leads."
    )

    consoleSpy.mockRestore()
  })
})
