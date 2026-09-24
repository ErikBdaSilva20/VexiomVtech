import { describe, expect, it } from "vitest"

import { createTransactionSchema } from "./transaction-schema"

const projectId = "11111111-1111-4111-8111-111111111111"
const partnerId = "22222222-2222-4222-8222-222222222222"

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    direction: "entrada",
    category: "Receita de projeto",
    amount: "1500.50",
    occurred_at: "2026-01-15",
    description: "Pagamento do projeto X",
    project_id: null,
    partner_id: null,
    ...overrides,
  }
}

describe("createTransactionSchema", () => {
  it("accepts a valid payload, coercing amount to a number", () => {
    const result = createTransactionSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.amount).toBe(1500.5)
  })

  it("rejects an unknown direction", () => {
    const result = createTransactionSchema.safeParse(validPayload({ direction: "transferencia" }))
    expect(result.success).toBe(false)
  })

  it("rejects a missing category", () => {
    const result = createTransactionSchema.safeParse(validPayload({ category: "" }))
    expect(result.success).toBe(false)
  })

  it("rejects a zero amount", () => {
    const result = createTransactionSchema.safeParse(validPayload({ amount: "0" }))
    expect(result.success).toBe(false)
  })

  it("rejects a negative amount", () => {
    const result = createTransactionSchema.safeParse(validPayload({ amount: "-10" }))
    expect(result.success).toBe(false)
  })

  it("rejects a non-numeric amount", () => {
    const result = createTransactionSchema.safeParse(validPayload({ amount: "not-a-number" }))
    expect(result.success).toBe(false)
  })

  it("rejects an amount over the numeric(12,2) ceiling", () => {
    const result = createTransactionSchema.safeParse(validPayload({ amount: "99999999999" }))
    expect(result.success).toBe(false)
  })

  it("accepts the exact numeric(12,2) ceiling", () => {
    const result = createTransactionSchema.safeParse(validPayload({ amount: "9999999999.99" }))
    expect(result.success).toBe(true)
  })

  it("rejects one cent over the numeric(12,2) ceiling", () => {
    const result = createTransactionSchema.safeParse(validPayload({ amount: "10000000000.00" }))
    expect(result.success).toBe(false)
  })

  it("rejects an amount with more than 2 decimal places", () => {
    const result = createTransactionSchema.safeParse(validPayload({ amount: "10.999" }))
    expect(result.success).toBe(false)
  })

  it("accepts an integer amount with no decimal part", () => {
    const result = createTransactionSchema.safeParse(validPayload({ amount: "100" }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.amount).toBe(100)
  })

  it("rejects a missing occurred_at", () => {
    const result = createTransactionSchema.safeParse(validPayload({ occurred_at: "" }))
    expect(result.success).toBe(false)
  })

  it("rejects a malformed occurred_at", () => {
    const result = createTransactionSchema.safeParse(validPayload({ occurred_at: "15/01/2026" }))
    expect(result.success).toBe(false)
  })

  it("rejects an out-of-range calendar date", () => {
    const result = createTransactionSchema.safeParse(validPayload({ occurred_at: "2026-02-30" }))
    expect(result.success).toBe(false)
  })

  it("rejects a missing description", () => {
    const result = createTransactionSchema.safeParse(validPayload({ description: "" }))
    expect(result.success).toBe(false)
  })

  it("rejects a whitespace-only category", () => {
    const result = createTransactionSchema.safeParse(validPayload({ category: "   " }))
    expect(result.success).toBe(false)
  })

  it("rejects a whitespace-only description", () => {
    const result = createTransactionSchema.safeParse(validPayload({ description: "   " }))
    expect(result.success).toBe(false)
  })

  it("treats an empty project_id as no project linked", () => {
    const result = createTransactionSchema.safeParse(validPayload({ project_id: "" }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.project_id).toBeNull()
  })

  it("rejects an invalid project_id", () => {
    const result = createTransactionSchema.safeParse(validPayload({ project_id: "not-a-uuid" }))
    expect(result.success).toBe(false)
  })

  it("accepts a valid project_id and partner_id", () => {
    const result = createTransactionSchema.safeParse(
      validPayload({ project_id: projectId, partner_id: partnerId })
    )
    expect(result.success).toBe(true)
  })

  it("does not accept a created_by field from the payload — set server-side only", () => {
    const result = createTransactionSchema.safeParse(validPayload({ created_by: "someone-else" }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).not.toHaveProperty("created_by")
  })
})
