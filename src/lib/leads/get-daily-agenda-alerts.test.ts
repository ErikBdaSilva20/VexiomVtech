import { describe, expect, it, vi } from "vitest"

import { getDailyAgendaAlerts } from "./get-daily-agenda-alerts"

const NOW = new Date("2026-09-24T15:00:00Z")

function buildSupabase({
  followUpLeads = { data: [], error: null as unknown },
  meetings = { data: [], error: null as unknown },
  meetingLeads = { data: [], error: null as unknown },
}: {
  followUpLeads?: { data: unknown[] | null; error: unknown }
  meetings?: { data: unknown[] | null; error: unknown }
  meetingLeads?: { data: unknown[] | null; error: unknown }
}) {
  let leadsCallCount = 0

  const from = vi.fn().mockImplementation((table: string) => {
    if (table === "lead_meetings") {
      return {
        select: () => ({
          eq: () => ({
            lt: vi.fn().mockResolvedValue(meetings),
          }),
        }),
      }
    }

    leadsCallCount += 1
    if (leadsCallCount === 1) {
      return {
        select: () => ({
          not: () => ({
            lt: vi.fn().mockResolvedValue(followUpLeads),
          }),
        }),
      }
    }

    return {
      select: () => ({
        in: vi.fn().mockResolvedValue(meetingLeads),
      }),
    }
  })

  return { from } as never
}

describe("getDailyAgendaAlerts", () => {
  it("returns follow-ups due today or overdue, excluding terminal-status leads", async () => {
    const supabase = buildSupabase({
      followUpLeads: {
        data: [
          { id: "lead-1", name: "Lead 1", status: "novo_lead", next_action_at: "2026-09-24T10:00:00Z" },
          { id: "lead-2", name: "Lead 2", status: "contrato_fechado", next_action_at: "2026-09-20T10:00:00Z" },
        ],
        error: null,
      },
    })

    const result = await getDailyAgendaAlerts(supabase, NOW)

    expect(result.followUps).toEqual([
      { leadId: "lead-1", leadName: "Lead 1", nextActionAt: "2026-09-24T10:00:00Z" },
    ])
  })

  it("returns meetings scheduled for today or overdue, joined with the lead's name", async () => {
    const supabase = buildSupabase({
      meetings: {
        data: [{ id: "meeting-1", lead_id: "lead-1", scheduled_at: "2026-09-24T14:00:00Z" }],
        error: null,
      },
      meetingLeads: { data: [{ id: "lead-1", name: "Lead 1" }], error: null },
    })

    const result = await getDailyAgendaAlerts(supabase, NOW)

    expect(result.meetings).toEqual([
      { meetingId: "meeting-1", leadId: "lead-1", leadName: "Lead 1", scheduledAt: "2026-09-24T14:00:00Z" },
    ])
  })

  it("returns empty lists when there is nothing due", async () => {
    const supabase = buildSupabase({})
    const result = await getDailyAgendaAlerts(supabase, NOW)
    expect(result).toEqual({ followUps: [], meetings: [] })
  })

  it("throws a generic error and logs when the follow-up query fails", async () => {
    const supabase = buildSupabase({ followUpLeads: { data: null, error: { message: "db down" } } })
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(getDailyAgendaAlerts(supabase, NOW)).rejects.toThrow(
      "Não foi possível carregar os compromissos do dia."
    )

    consoleSpy.mockRestore()
  })

  it("throws a generic error and logs when the meetings query fails", async () => {
    const supabase = buildSupabase({ meetings: { data: null, error: { message: "db down" } } })
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    await expect(getDailyAgendaAlerts(supabase, NOW)).rejects.toThrow(
      "Não foi possível carregar os compromissos do dia."
    )

    consoleSpy.mockRestore()
  })
})
