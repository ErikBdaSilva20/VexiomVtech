import { describe, expect, it } from "vitest"

import { createCaseSchema, updateCaseSchema } from "./case-schema"

const projectId = "11111111-1111-4111-8111-111111111111"
const caseId = "22222222-2222-4222-8222-222222222222"

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: "Projeto X",
    slug: "projeto-x",
    category: "Sistema sob medida",
    client_name: null,
    project_id: null,
    description: "Descrição detalhada",
    problem_solved: "Resolveu Y",
    motivation: "Motivação Z",
    external_link: null,
    tech_stack: "Next.js, Supabase",
    is_founder_project: false,
    display_order: 0,
    ...overrides,
  }
}

describe("createCaseSchema", () => {
  it("accepts a valid payload", () => {
    const result = createCaseSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
  })

  it("splits tech_stack into a trimmed array, dropping empty entries", () => {
    const result = createCaseSchema.safeParse(validPayload({ tech_stack: "Next.js,  , Supabase," }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.tech_stack).toEqual(["Next.js", "Supabase"])
  })

  it("rejects a malformed slug", () => {
    const result = createCaseSchema.safeParse(validPayload({ slug: "Projeto X!" }))
    expect(result.success).toBe(false)
  })

  it("rejects a missing title", () => {
    const result = createCaseSchema.safeParse(validPayload({ title: "" }))
    expect(result.success).toBe(false)
  })

  it("rejects a missing category", () => {
    const result = createCaseSchema.safeParse(validPayload({ category: "" }))
    expect(result.success).toBe(false)
  })

  it("treats an empty project_id as no project selected", () => {
    const result = createCaseSchema.safeParse(validPayload({ project_id: "" }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.project_id).toBeNull()
  })

  it("rejects an invalid project_id", () => {
    const result = createCaseSchema.safeParse(validPayload({ project_id: "not-a-uuid" }))
    expect(result.success).toBe(false)
  })

  it("accepts a valid project_id", () => {
    const result = createCaseSchema.safeParse(validPayload({ project_id: projectId }))
    expect(result.success).toBe(true)
  })

  it("treats an empty external_link as null", () => {
    const result = createCaseSchema.safeParse(validPayload({ external_link: "" }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.external_link).toBeNull()
  })

  it("rejects a malformed external_link", () => {
    const result = createCaseSchema.safeParse(validPayload({ external_link: "not-a-url" }))
    expect(result.success).toBe(false)
  })

  it("rejects a negative display_order", () => {
    const result = createCaseSchema.safeParse(validPayload({ display_order: -1 }))
    expect(result.success).toBe(false)
  })

  it("does not accept a published field — creation is always a draft", () => {
    const result = createCaseSchema.safeParse(validPayload({ published: true }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).not.toHaveProperty("published")
  })
})

describe("updateCaseSchema", () => {
  it("accepts a valid payload with case_id and published", () => {
    const result = updateCaseSchema.safeParse({
      ...validPayload(),
      case_id: caseId,
      published: true,
    })
    expect(result.success).toBe(true)
  })

  it("rejects a missing case_id", () => {
    const result = updateCaseSchema.safeParse({ ...validPayload(), published: true })
    expect(result.success).toBe(false)
  })
})
