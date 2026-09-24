import { describe, expect, it } from "vitest"

import { createContractSchema } from "./contract-schema"

const leadId = "11111111-1111-4111-8111-111111111111"

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    lead_id: leadId,
    service_types: ["site"],
    amount: "1500.50",
    hours: null,
    ...overrides,
  }
}

describe("createContractSchema", () => {
  it("accepts a valid payload without hours when there is no demanda service", () => {
    const result = createContractSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.amount).toBe(1500.5)
  })

  it("rejects an invalid lead_id", () => {
    const result = createContractSchema.safeParse(validPayload({ lead_id: "not-a-uuid" }))
    expect(result.success).toBe(false)
  })

  it("rejects an empty service_types array", () => {
    const result = createContractSchema.safeParse(validPayload({ service_types: [] }))
    expect(result.success).toBe(false)
  })

  it("rejects an unknown service type", () => {
    const result = createContractSchema.safeParse(validPayload({ service_types: ["nao_existe"] }))
    expect(result.success).toBe(false)
  })

  it("rejects a zero or negative amount", () => {
    expect(createContractSchema.safeParse(validPayload({ amount: "0" })).success).toBe(false)
    expect(createContractSchema.safeParse(validPayload({ amount: "-10" })).success).toBe(false)
  })

  it("rejects an amount with more than 2 decimal places", () => {
    const result = createContractSchema.safeParse(validPayload({ amount: "10.999" }))
    expect(result.success).toBe(false)
  })

  it("requires hours when service_types includes demanda", () => {
    const result = createContractSchema.safeParse(
      validPayload({ service_types: ["site", "demanda"], hours: null })
    )
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.hours).toBeDefined()
    }
  })

  it("accepts hours when service_types includes demanda and hours is provided", () => {
    const result = createContractSchema.safeParse(
      validPayload({ service_types: ["demanda"], hours: "10.5" })
    )
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.hours).toBe(10.5)
  })

  it("does not require hours when there is no demanda service, even if omitted", () => {
    const result = createContractSchema.safeParse(validPayload({ hours: undefined }))
    expect(result.success).toBe(true)
  })

  it("rejects a zero or negative hours value", () => {
    const result = createContractSchema.safeParse(
      validPayload({ service_types: ["demanda"], hours: "0" })
    )
    expect(result.success).toBe(false)
  })

  it("treats an empty hours string as null", () => {
    const result = createContractSchema.safeParse(validPayload({ hours: "" }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.hours).toBeNull()
  })

  it("does not accept a created_by field from the payload — set server-side only", () => {
    const result = createContractSchema.safeParse(validPayload({ created_by: "someone-else" }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).not.toHaveProperty("created_by")
  })
})
