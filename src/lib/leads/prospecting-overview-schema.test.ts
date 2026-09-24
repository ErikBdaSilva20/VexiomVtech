import { describe, expect, it } from "vitest"

import { prospectingOverviewQuerySchema } from "./prospecting-overview-schema"

describe("prospectingOverviewQuerySchema", () => {
  it("accepts an empty query (defaults resolved by the DAL, not the schema)", () => {
    const result = prospectingOverviewQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts from/to independently", () => {
    expect(prospectingOverviewQuerySchema.safeParse({ from: "2026-01-01" }).success).toBe(true)
    expect(prospectingOverviewQuerySchema.safeParse({ to: "2026-01-01" }).success).toBe(true)
  })

  it("accepts a valid from <= to range", () => {
    const result = prospectingOverviewQuerySchema.safeParse({
      from: "2026-01-01",
      to: "2026-02-01",
    })
    expect(result.success).toBe(true)
  })

  it("rejects from > to", () => {
    const result = prospectingOverviewQuerySchema.safeParse({
      from: "2026-05-01",
      to: "2026-02-01",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a malformed date", () => {
    const result = prospectingOverviewQuerySchema.safeParse({ from: "not-a-date" })
    expect(result.success).toBe(false)
  })
})
