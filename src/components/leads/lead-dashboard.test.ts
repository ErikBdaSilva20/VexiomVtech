import { describe, expect, it } from "vitest"

import { appointmentUrgency, buildRiskGroups, monthDateRange } from "./lead-dashboard"
import type { LeadRiskAlerts } from "@/lib/leads/get-lead-risk-alerts"
import type { Database } from "@/lib/supabase/database.types"

type LeadRow = Database["public"]["Tables"]["leads"]["Row"]

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

describe("appointmentUrgency", () => {
  const now = new Date("2026-09-25T16:50:00.000Z")

  it("is upcoming when more than 1h away", () => {
    expect(appointmentUrgency("2026-09-25T19:00:00.000Z", now)).toBe("upcoming")
  })

  it("is urgent when within 1h", () => {
    expect(appointmentUrgency("2026-09-25T17:00:00.000Z", now)).toBe("urgent")
  })

  it("is urgent exactly at the 1h boundary", () => {
    expect(appointmentUrgency("2026-09-25T17:50:00.000Z", now)).toBe("urgent")
  })

  it("is urgent when already overdue", () => {
    expect(appointmentUrgency("2026-09-25T16:00:00.000Z", now)).toBe("urgent")
  })
})

function lead(id: string): LeadRow {
  return { id } as LeadRow
}

describe("buildRiskGroups", () => {
  it("returns an empty array when risk failed to load", () => {
    expect(buildRiskGroups(null)).toEqual([])
  })

  it("maps each of the four risk categories to its label and leads, preserving counts", () => {
    const risk: LeadRiskAlerts = {
      slaBreached: [lead("a"), lead("b")],
      noNextAction: [lead("c")],
      overdueFollowUps: [],
      coolingLeads: [lead("d"), lead("e"), lead("f")],
    }

    const groups = buildRiskGroups(risk)

    expect(groups.map((group) => group.label)).toEqual([
      "SLA estourado",
      "Sem próxima ação",
      "Follow-ups vencidos",
      "Leads esfriando",
    ])
    expect(groups.find((group) => group.label === "SLA estourado")?.items).toBe(risk.slaBreached)
    expect(groups.find((group) => group.label === "Sem próxima ação")?.items).toHaveLength(1)
    expect(groups.find((group) => group.label === "Follow-ups vencidos")?.items).toHaveLength(0)
    expect(groups.find((group) => group.label === "Leads esfriando")?.items).toHaveLength(3)
  })
})
