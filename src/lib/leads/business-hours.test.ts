import { describe, expect, it } from "vitest"

import { businessHoursElapsed } from "./business-hours"

describe("businessHoursElapsed", () => {
  it("returns 0 when to is not after from", () => {
    const t = new Date("2026-09-21T15:00:00Z")
    expect(businessHoursElapsed(t, t)).toBe(0)
    expect(businessHoursElapsed(t, new Date(t.getTime() - 1000))).toBe(0)
  })

  it("counts hours within the same business day (Mon 09:00-18:00 local)", () => {
    // 2026-09-21 is a Monday. 13:00Z = 10:00 local; 16:00Z = 13:00 local.
    const from = new Date("2026-09-21T13:00:00Z")
    const to = new Date("2026-09-21T16:00:00Z")
    expect(businessHoursElapsed(from, to)).toBe(3)
  })

  it("clips hours before/after the business window on the same day", () => {
    // 08:00Z = 05:00 local (before 09:00), 23:00Z = 20:00 local (after 18:00)
    const from = new Date("2026-09-21T08:00:00Z")
    const to = new Date("2026-09-21T23:00:00Z")
    expect(businessHoursElapsed(from, to)).toBe(9)
  })

  it("skips weekends entirely", () => {
    // Sat 2026-09-19 12:00Z through Sun 2026-09-20 12:00Z — no business hours
    const from = new Date("2026-09-19T12:00:00Z")
    const to = new Date("2026-09-20T12:00:00Z")
    expect(businessHoursElapsed(from, to)).toBe(0)
  })

  it("accumulates across multiple business days, skipping the weekend between them", () => {
    // Fri 2026-09-18 12:00Z (09:00 local) through Mon 2026-09-21 21:00Z (18:00 local)
    // Fri: 9h (09:00-18:00 local), Sat/Sun: 0, Mon: 9h (09:00-18:00 local) = 18h
    const from = new Date("2026-09-18T12:00:00Z")
    const to = new Date("2026-09-21T21:00:00Z")
    expect(businessHoursElapsed(from, to)).toBe(18)
  })

  it("exceeds the 12-hour SLA threshold after two full business days", () => {
    const from = new Date("2026-09-21T12:00:00Z") // Mon 09:00 local
    const to = new Date("2026-09-22T22:00:00Z") // Tue 19:00 local
    expect(businessHoursElapsed(from, to)).toBeGreaterThan(12)
  })
})
