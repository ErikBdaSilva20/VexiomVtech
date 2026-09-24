import { describe, expect, it } from "vitest"

import { createLeadMeetingSchema, updateLeadMeetingStatusSchema } from "./lead-meeting-schema"

const leadId = "11111111-1111-4111-8111-111111111111"
const meetingId = "22222222-2222-4222-8222-222222222222"

describe("createLeadMeetingSchema", () => {
  it("accepts a valid payload without notes", () => {
    const result = createLeadMeetingSchema.safeParse({
      lead_id: leadId,
      scheduled_at: "2026-10-01T14:00:00Z",
    })
    expect(result.success).toBe(true)
  })

  it("accepts notes", () => {
    const result = createLeadMeetingSchema.safeParse({
      lead_id: leadId,
      scheduled_at: "2026-10-01T14:00:00Z",
      notes: "Reunião de kickoff",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a malformed scheduled_at", () => {
    const result = createLeadMeetingSchema.safeParse({
      lead_id: leadId,
      scheduled_at: "not-a-date",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a missing scheduled_at", () => {
    const result = createLeadMeetingSchema.safeParse({ lead_id: leadId })
    expect(result.success).toBe(false)
  })
})

describe("updateLeadMeetingStatusSchema", () => {
  it.each(["realizada", "cancelada"])("accepts target status %s", (status) => {
    const result = updateLeadMeetingStatusSchema.safeParse({
      meeting_id: meetingId,
      status,
      expected_status: "agendada",
    })
    expect(result.success).toBe(true)
  })

  it("rejects agendada as a target status — not an admin-triggerable transition", () => {
    const result = updateLeadMeetingStatusSchema.safeParse({
      meeting_id: meetingId,
      status: "agendada",
      expected_status: "agendada",
    })
    expect(result.success).toBe(false)
  })

  it("accepts any of the three values as expected_status", () => {
    for (const expected of ["agendada", "realizada", "cancelada"]) {
      const result = updateLeadMeetingStatusSchema.safeParse({
        meeting_id: meetingId,
        status: "realizada",
        expected_status: expected,
      })
      expect(result.success).toBe(true)
    }
  })

  it("rejects a missing expected_status", () => {
    const result = updateLeadMeetingStatusSchema.safeParse({
      meeting_id: meetingId,
      status: "realizada",
    })
    expect(result.success).toBe(false)
  })
})
