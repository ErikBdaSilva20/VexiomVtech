import { describe, expect, it } from "vitest"

import { monthDateRange } from "./lead-dashboard"

describe("monthDateRange", () => {
  it("returns the first and last calendar day of a regular month", () => {
    expect(monthDateRange("2026-02")).toEqual({ from: "2026-02-01", to: "2026-02-28" })
  })

  it("accounts for a leap year", () => {
    expect(monthDateRange("2024-02")).toEqual({ from: "2024-02-01", to: "2024-02-29" })
  })

  it("handles a year-end month", () => {
    expect(monthDateRange("2026-12")).toEqual({ from: "2026-12-01", to: "2026-12-31" })
  })
})
