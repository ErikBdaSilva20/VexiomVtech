import { describe, expect, it } from "vitest"

import { localDateString, localMonthString, startOfLocalDay, startOfNextLocalDay } from "./sao-paulo-time"

describe("startOfNextLocalDay", () => {
  it("returns the UTC instant of local midnight starting the next day", () => {
    // 2026-09-24T15:00:00Z = 12:00 local (Sao Paulo). Next local midnight is
    // 2026-09-25T00:00:00-03:00 = 2026-09-25T03:00:00Z.
    const now = new Date("2026-09-24T15:00:00Z")
    expect(startOfNextLocalDay(now).toISOString()).toBe("2026-09-25T03:00:00.000Z")
  })

  it("rolls to the following day when already past local midnight", () => {
    // 2026-09-24T02:00:00Z = 2026-09-23T23:00:00-03:00 (still the 23rd locally).
    const now = new Date("2026-09-24T02:00:00Z")
    expect(startOfNextLocalDay(now).toISOString()).toBe("2026-09-24T03:00:00.000Z")
  })
})

describe("startOfLocalDay", () => {
  it("returns the UTC instant of local midnight for a calendar date", () => {
    expect(startOfLocalDay("2026-01-01").toISOString()).toBe("2026-01-01T03:00:00.000Z")
  })
})

describe("localDateString", () => {
  it("reports the previous UTC date's evening as still today locally", () => {
    // 2026-09-24T02:00:00Z = 2026-09-23T23:00:00-03:00
    expect(localDateString(new Date("2026-09-24T02:00:00Z"))).toBe("2026-09-23")
  })
})

describe("localMonthString", () => {
  it("keeps a late-night instant in the previous local month", () => {
    // 2026-02-01T02:30:00Z = 2026-01-31T23:30:00-03:00
    expect(localMonthString(new Date("2026-02-01T02:30:00Z"))).toBe("2026-01")
  })
})
