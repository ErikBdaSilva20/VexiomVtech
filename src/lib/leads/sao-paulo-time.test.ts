import { describe, expect, it } from "vitest"

import { startOfNextLocalDay } from "./sao-paulo-time"

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
