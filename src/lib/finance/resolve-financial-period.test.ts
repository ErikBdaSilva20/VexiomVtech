import { describe, expect, it } from "vitest"

import { resolveFinancialPeriod } from "./resolve-financial-period"
import { localDateString } from "@/lib/leads/sao-paulo-time"

describe("resolveFinancialPeriod", () => {
  it("defaults to the current calendar month (1st through today) when no period is given", () => {
    const result = resolveFinancialPeriod({})

    const today = localDateString(new Date())
    const [year, month] = today.split("-")
    expect(result.from).toBe(`${year}-${month}-01`)
    expect(result.to).toBe(today)
  })

  it("uses the explicit from/to bounds when both are given", () => {
    const result = resolveFinancialPeriod({ from: "2026-01-01", to: "2026-01-31" })
    expect(result).toEqual({ from: "2026-01-01", to: "2026-01-31" })
  })

  it("defaults to (given day) through today when only from is given", () => {
    const result = resolveFinancialPeriod({ from: "2026-01-01" })
    expect(result.from).toBe("2026-01-01")
    expect(result.to).toBe(localDateString(new Date()))
  })

  it("defaults from to the 1st of to's month when only to is given", () => {
    const result = resolveFinancialPeriod({ to: "2026-03-15" })
    expect(result).toEqual({ from: "2026-03-01", to: "2026-03-15" })
  })
})
