import { describe, expect, it } from "vitest"

import {
  updateLeadAssigneeSchema,
  updateLeadNextActionSchema,
  updateLeadNonConversionReasonSchema,
  updateLeadProbabilitySchema,
  updateLeadTagsSchema,
} from "./lead-qualification-schema"

const leadId = "11111111-1111-4111-8111-111111111111"
const adminId = "22222222-2222-4222-8222-222222222222"

describe("updateLeadNextActionSchema", () => {
  it("accepts text + datetime", () => {
    const result = updateLeadNextActionSchema.safeParse({
      lead_id: leadId,
      next_action: "Enviar proposta",
      next_action_at: "2026-10-01T10:00:00Z",
    })
    expect(result.success).toBe(true)
  })

  it("accepts null to clear both fields", () => {
    const result = updateLeadNextActionSchema.safeParse({
      lead_id: leadId,
      next_action: null,
      next_action_at: null,
    })
    expect(result.success).toBe(true)
  })

  it("rejects a malformed next_action_at", () => {
    const result = updateLeadNextActionSchema.safeParse({
      lead_id: leadId,
      next_action: "x",
      next_action_at: "not-a-date",
    })
    expect(result.success).toBe(false)
  })
})

describe("updateLeadProbabilitySchema", () => {
  it.each(["baixa", "media", "alta"])("accepts %s", (probability) => {
    expect(
      updateLeadProbabilitySchema.safeParse({ lead_id: leadId, probability }).success
    ).toBe(true)
  })

  it("accepts null to clear it", () => {
    expect(
      updateLeadProbabilitySchema.safeParse({ lead_id: leadId, probability: null }).success
    ).toBe(true)
  })

  it("rejects a value outside the enum", () => {
    expect(
      updateLeadProbabilitySchema.safeParse({ lead_id: leadId, probability: "altissima" }).success
    ).toBe(false)
  })
})

describe("updateLeadTagsSchema", () => {
  it("accepts a list of tags", () => {
    const result = updateLeadTagsSchema.safeParse({ lead_id: leadId, tags: ["urgente", "vip"] })
    expect(result.success).toBe(true)
  })

  it("accepts an empty array (clearing all tags)", () => {
    expect(updateLeadTagsSchema.safeParse({ lead_id: leadId, tags: [] }).success).toBe(true)
  })

  it("rejects an empty-string tag", () => {
    expect(updateLeadTagsSchema.safeParse({ lead_id: leadId, tags: [""] }).success).toBe(false)
  })

  it("rejects more than the max number of tags", () => {
    const tags = Array.from({ length: 21 }, (_, i) => `tag-${i}`)
    expect(updateLeadTagsSchema.safeParse({ lead_id: leadId, tags }).success).toBe(false)
  })
})

describe("updateLeadNonConversionReasonSchema", () => {
  it("accepts a reason", () => {
    expect(
      updateLeadNonConversionReasonSchema.safeParse({
        lead_id: leadId,
        non_conversion_reason: "Fechou com concorrente",
      }).success
    ).toBe(true)
  })

  it("normalizes an empty string to null", () => {
    const result = updateLeadNonConversionReasonSchema.safeParse({
      lead_id: leadId,
      non_conversion_reason: "",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.non_conversion_reason).toBeNull()
    }
  })
})

describe("updateLeadAssigneeSchema", () => {
  it("accepts assigning to an admin with a matching expected_assigned_to", () => {
    expect(
      updateLeadAssigneeSchema.safeParse({
        lead_id: leadId,
        assigned_to: adminId,
        expected_assigned_to: null,
      }).success
    ).toBe(true)
  })

  it("accepts unassigning (assigned_to: null)", () => {
    expect(
      updateLeadAssigneeSchema.safeParse({
        lead_id: leadId,
        assigned_to: null,
        expected_assigned_to: adminId,
      }).success
    ).toBe(true)
  })

  it("rejects an assigned_to that isn't a UUID", () => {
    expect(
      updateLeadAssigneeSchema.safeParse({
        lead_id: leadId,
        assigned_to: "not-a-uuid",
        expected_assigned_to: null,
      }).success
    ).toBe(false)
  })
})
