import { describe, expect, it } from "vitest"

import { financialPeriodQuerySchema } from "./financial-period-schema"

describe("financialPeriodQuerySchema", () => {
  it("accepts an empty query (no period given)", () => {
    const result = financialPeriodQuerySchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it("accepts from-only", () => {
    const result = financialPeriodQuerySchema.safeParse({ from: "2026-01-01" })
    expect(result.success).toBe(true)
  })

  it("accepts to-only", () => {
    const result = financialPeriodQuerySchema.safeParse({ to: "2026-01-31" })
    expect(result.success).toBe(true)
  })

  it("accepts a valid from/to range", () => {
    const result = financialPeriodQuerySchema.safeParse({ from: "2026-01-01", to: "2026-01-31" })
    expect(result.success).toBe(true)
  })

  it("rejects from after to", () => {
    const result = financialPeriodQuerySchema.safeParse({ from: "2026-02-01", to: "2026-01-01" })
    expect(result.success).toBe(false)
  })

  it("accepts from equal to to", () => {
    const result = financialPeriodQuerySchema.safeParse({ from: "2026-01-01", to: "2026-01-01" })
    expect(result.success).toBe(true)
  })

  it("rejects a malformed from date", () => {
    const result = financialPeriodQuerySchema.safeParse({ from: "01/01/2026" })
    expect(result.success).toBe(false)
  })

  it("rejects a malformed to date", () => {
    const result = financialPeriodQuerySchema.safeParse({ to: "31/01/2026" })
    expect(result.success).toBe(false)
  })
})
