import { describe, expect, it } from "vitest"

import { manualLeadSchema, publicLeadSchema } from "./lead-schema"

const validPayload = {
  name: "Erik",
  email: "erik@example.com",
  whatsapp: "11999999999",
  project_type: "site institucional",
  description: "Preciso de um site novo para a empresa.",
}

describe("publicLeadSchema", () => {
  it("accepts a payload with only required fields", () => {
    const result = publicLeadSchema.safeParse(validPayload)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company).toBeNull()
      expect(result.data.desired_deadline).toBeNull()
      expect(result.data.budget_range).toBeNull()
      expect(result.data.preferred_channel).toBeNull()
      expect(result.data.preferred_time).toBeNull()
    }
  })

  it("accepts a payload with all optional fields filled", () => {
    const result = publicLeadSchema.safeParse({
      ...validPayload,
      company: "Vexiom",
      desired_deadline: "30 dias",
      budget_range: "R$ 5.000 - R$ 10.000",
      preferred_channel: "whatsapp",
      preferred_time: "manhã",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company).toBe("Vexiom")
    }
  })

  it("normalizes an empty-string optional field to null", () => {
    const result = publicLeadSchema.safeParse({ ...validPayload, company: "" })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company).toBeNull()
    }
  })

  it.each(["name", "email", "whatsapp", "project_type", "description"])(
    "rejects a payload missing required field %s",
    (field) => {
      const payload = { ...validPayload, [field]: "" }
      const result = publicLeadSchema.safeParse(payload)

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.flatten().fieldErrors[field as keyof typeof payload]).toBeTruthy()
      }
    }
  )

  it("rejects an invalid email", () => {
    const result = publicLeadSchema.safeParse({ ...validPayload, email: "not-an-email" })

    expect(result.success).toBe(false)
  })

  it("rejects a field longer than the max length", () => {
    const result = publicLeadSchema.safeParse({ ...validPayload, name: "a".repeat(201) })

    expect(result.success).toBe(false)
  })
})

describe("manualLeadSchema", () => {
  it("accepts a valid payload with source", () => {
    const result = manualLeadSchema.safeParse({ ...validPayload, source: "indicação" })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.source).toBe("indicação")
    }
  })

  it("rejects a payload missing source", () => {
    const result = manualLeadSchema.safeParse(validPayload)

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.source).toBeTruthy()
    }
  })

  it("rejects an empty source", () => {
    const result = manualLeadSchema.safeParse({ ...validPayload, source: "" })

    expect(result.success).toBe(false)
  })
})
