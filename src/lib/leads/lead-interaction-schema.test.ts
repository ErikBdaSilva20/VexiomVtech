import { describe, expect, it } from "vitest"

import { createLeadInteractionSchema } from "./lead-interaction-schema"

const validPayload = {
  lead_id: "11111111-1111-4111-8111-111111111111",
  type: "nota" as const,
  content: "Cliente pediu orçamento revisado.",
}

describe("createLeadInteractionSchema", () => {
  it("accepts a valid payload without occurred_at", () => {
    const result = createLeadInteractionSchema.safeParse(validPayload)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.occurred_at).toBeUndefined()
    }
  })

  it("accepts a valid retroactive occurred_at", () => {
    const result = createLeadInteractionSchema.safeParse({
      ...validPayload,
      occurred_at: "2026-01-01T10:00:00Z",
    })

    expect(result.success).toBe(true)
  })

  it.each(["nota", "mensagem_enviada", "mensagem_recebida"])("accepts type %s", (type) => {
    const result = createLeadInteractionSchema.safeParse({ ...validPayload, type })

    expect(result.success).toBe(true)
  })

  it("rejects mudanca_status — that type is trigger-only", () => {
    const result = createLeadInteractionSchema.safeParse({
      ...validPayload,
      type: "mudanca_status",
    })

    expect(result.success).toBe(false)
  })

  it("rejects an invalid lead_id", () => {
    const result = createLeadInteractionSchema.safeParse({ ...validPayload, lead_id: "not-a-uuid" })

    expect(result.success).toBe(false)
  })

  it("rejects empty content", () => {
    const result = createLeadInteractionSchema.safeParse({ ...validPayload, content: "" })

    expect(result.success).toBe(false)
  })

  it("rejects a malformed occurred_at", () => {
    const result = createLeadInteractionSchema.safeParse({
      ...validPayload,
      occurred_at: "not-a-date",
    })

    expect(result.success).toBe(false)
  })
})
