import { describe, expect, it } from "vitest"

import { createProjectSchema, updateProjectSchema } from "./project-schema"

const leadId = "11111111-1111-4111-8111-111111111111"
const projectId = "22222222-2222-4222-8222-222222222222"

function validPayload(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    title: "Projeto X",
    client_name: null,
    lead_id: null,
    started_at: null,
    finished_at: null,
    ...overrides,
  }
}

describe("createProjectSchema", () => {
  it("accepts a valid payload and defaults status to em_andamento", () => {
    const result = createProjectSchema.safeParse(validPayload())
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.status).toBe("em_andamento")
  })

  it("rejects a missing title", () => {
    const result = createProjectSchema.safeParse(validPayload({ title: "" }))
    expect(result.success).toBe(false)
  })

  it("treats an empty lead_id as no lead selected", () => {
    const result = createProjectSchema.safeParse(validPayload({ lead_id: "" }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.lead_id).toBeNull()
  })

  it("rejects an invalid lead_id", () => {
    const result = createProjectSchema.safeParse(validPayload({ lead_id: "not-a-uuid" }))
    expect(result.success).toBe(false)
  })

  it("accepts a valid lead_id", () => {
    const result = createProjectSchema.safeParse(validPayload({ lead_id: leadId }))
    expect(result.success).toBe(true)
  })

  it("rejects an unknown status", () => {
    const result = createProjectSchema.safeParse(validPayload({ status: "arquivado" }))
    expect(result.success).toBe(false)
  })

  it("rejects status concluido without finished_at", () => {
    const result = createProjectSchema.safeParse(validPayload({ status: "concluido" }))
    expect(result.success).toBe(false)
  })

  it("accepts status concluido with finished_at", () => {
    const result = createProjectSchema.safeParse(
      validPayload({ status: "concluido", finished_at: "2026-01-01" })
    )
    expect(result.success).toBe(true)
  })

  it("rejects a malformed date", () => {
    const result = createProjectSchema.safeParse(validPayload({ started_at: "not-a-date" }))
    expect(result.success).toBe(false)
  })

  it("rejects finished_at earlier than started_at", () => {
    const result = createProjectSchema.safeParse(
      validPayload({ started_at: "2026-02-01", finished_at: "2026-01-01" })
    )
    expect(result.success).toBe(false)
  })

  it("accepts finished_at equal to started_at", () => {
    const result = createProjectSchema.safeParse(
      validPayload({ status: "concluido", started_at: "2026-01-01", finished_at: "2026-01-01" })
    )
    expect(result.success).toBe(true)
  })

  it("rejects a title over 200 characters", () => {
    const result = createProjectSchema.safeParse(validPayload({ title: "a".repeat(201) }))
    expect(result.success).toBe(false)
  })

  it("trims a blank client_name down to null", () => {
    const result = createProjectSchema.safeParse(validPayload({ client_name: "   " }))
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.client_name).toBeNull()
  })
})

describe("updateProjectSchema", () => {
  it("accepts a valid payload with project_id", () => {
    const result = updateProjectSchema.safeParse({
      ...validPayload(),
      project_id: projectId,
      status: "em_andamento",
    })
    expect(result.success).toBe(true)
  })

  it("rejects a missing project_id", () => {
    const result = updateProjectSchema.safeParse({ ...validPayload(), status: "em_andamento" })
    expect(result.success).toBe(false)
  })

  it("rejects moving to concluido without finished_at", () => {
    const result = updateProjectSchema.safeParse({
      ...validPayload(),
      project_id: projectId,
      status: "concluido",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a malformed (non-UUID) project_id", () => {
    const result = updateProjectSchema.safeParse({
      ...validPayload(),
      project_id: "not-a-uuid",
      status: "em_andamento",
    })
    expect(result.success).toBe(false)
  })
})
