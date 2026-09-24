import { describe, expect, it } from "vitest"

import { updateLeadStatusSchema } from "./update-lead-status-schema"

const validPayload = {
  lead_id: "11111111-1111-4111-8111-111111111111",
  status: "em_analise",
  expected_status: "novo_lead",
}

describe("updateLeadStatusSchema", () => {
  it("accepts a valid payload", () => {
    expect(updateLeadStatusSchema.safeParse(validPayload).success).toBe(true)
  })

  it("rejects a missing expected_status", () => {
    const rest: Partial<typeof validPayload> = { ...validPayload }
    delete rest.expected_status
    expect(updateLeadStatusSchema.safeParse(rest).success).toBe(false)
  })

  it("rejects an invalid status", () => {
    expect(
      updateLeadStatusSchema.safeParse({ ...validPayload, status: "inventado" }).success
    ).toBe(false)
  })

  it("rejects an invalid lead_id", () => {
    expect(
      updateLeadStatusSchema.safeParse({ ...validPayload, lead_id: "not-a-uuid" }).success
    ).toBe(false)
  })
})
