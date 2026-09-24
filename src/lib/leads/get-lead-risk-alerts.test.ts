import { describe, expect, it, vi } from "vitest"

import { getLeadRiskAlerts } from "./get-lead-risk-alerts"

function mockClient(result: { data: unknown[] | null; error: unknown }) {
  const select = vi.fn().mockResolvedValue(result)
  const from = vi.fn().mockReturnValue({ select })
  return { from, select }
}

const NOW = new Date("2026-09-24T15:00:00Z") // Thursday

function baseRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "lead-1",
    name: "Lead",
    company: null,
    status: "novo_lead",
    created_at: "2026-09-24T12:00:00Z",
    viewed_at: null,
    next_action: null,
    next_action_at: null,
    last_interaction_at: null,
    ...overrides,
  }
}

describe("getLeadRiskAlerts", () => {
  it("flags SLA breach when unviewed and business hours exceed the threshold", () => {
    return runAndExpect(
      [baseRow({ id: "old", created_at: "2026-09-21T12:00:00Z", viewed_at: null })],
      (alerts) => {
        expect(alerts.slaBreached.map((r) => r.id)).toEqual(["old"])
      }
    )
  })

  it("does not flag SLA breach when already viewed", () => {
    return runAndExpect(
      [baseRow({ id: "viewed", created_at: "2026-09-21T12:00:00Z", viewed_at: "2026-09-22T12:00:00Z" })],
      (alerts) => {
        expect(alerts.slaBreached).toEqual([])
      }
    )
  })

  it("flags missing next action for non-terminal leads", () => {
    return runAndExpect([baseRow({ id: "no-action", next_action: null })], (alerts) => {
      expect(alerts.noNextAction.map((r) => r.id)).toEqual(["no-action"])
    })
  })

  it("flags overdue follow-ups", () => {
    return runAndExpect(
      [baseRow({ id: "overdue", next_action_at: "2026-09-20T12:00:00Z" })],
      (alerts) => {
        expect(alerts.overdueFollowUps.map((r) => r.id)).toEqual(["overdue"])
      }
    )
  })

  it("does not flag future follow-ups as overdue", () => {
    return runAndExpect(
      [baseRow({ id: "future", next_action_at: "2026-09-30T12:00:00Z" })],
      (alerts) => {
        expect(alerts.overdueFollowUps).toEqual([])
      }
    )
  })

  it("flags cooling leads with no interaction or interaction older than 5 days", () => {
    return runAndExpect(
      [
        baseRow({ id: "never-interacted", last_interaction_at: null }),
        baseRow({ id: "stale", last_interaction_at: "2026-09-01T12:00:00Z" }),
        baseRow({ id: "fresh", last_interaction_at: "2026-09-24T10:00:00Z" }),
      ],
      (alerts) => {
        expect(alerts.coolingLeads.map((r) => r.id).sort()).toEqual(["never-interacted", "stale"])
      }
    )
  })

  it("never includes terminal-status leads in any list, even when every condition matches", () => {
    return runAndExpect(
      [
        baseRow({
          id: "closed",
          status: "contrato_fechado",
          created_at: "2026-09-01T12:00:00Z",
          viewed_at: null,
          next_action: null,
          next_action_at: "2026-09-01T12:00:00Z",
          last_interaction_at: null,
        }),
      ],
      (alerts) => {
        expect(alerts.slaBreached).toEqual([])
        expect(alerts.noNextAction).toEqual([])
        expect(alerts.overdueFollowUps).toEqual([])
        expect(alerts.coolingLeads).toEqual([])
      }
    )
  })

  it("throws a generic error and logs when the query fails", async () => {
    const { from } = mockClient({ data: null, error: { message: "db down" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(getLeadRiskAlerts(supabase, NOW)).rejects.toThrow(
      "Não foi possível carregar os alertas de risco da prospecção."
    )

    consoleSpy.mockRestore()
  })
})

async function runAndExpect(rows: unknown[], assert: (alerts: Awaited<ReturnType<typeof getLeadRiskAlerts>>) => void) {
  const { from } = mockClient({ data: rows, error: null })
  const supabase = { from } as never
  const alerts = await getLeadRiskAlerts(supabase, NOW)
  assert(alerts)
}
