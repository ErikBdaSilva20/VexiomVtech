import { beforeEach, describe, expect, it, vi } from "vitest"

import { createAdminClient } from "@/lib/supabase/admin"
import { POST } from "./route"

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

const validPayload = {
  name: "Erik",
  email: "erik@example.com",
  whatsapp: "11999999999",
  project_type: "site institucional",
  description: "Preciso de um site novo para a empresa.",
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/leads", {
    method: "POST",
    body: JSON.stringify(body),
  })
}

function mockAdminClient({
  singleResult,
}: {
  singleResult: { data: { id: string } | null; error: unknown }
}) {
  const single = vi.fn().mockResolvedValue(singleResult)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  const from = vi.fn().mockReturnValue({ insert })

  vi.mocked(createAdminClient).mockReturnValue({ from } as never)

  return { from, insert, select, single }
}

describe("POST /api/leads", () => {
  beforeEach(() => {
    vi.mocked(createAdminClient).mockReset()
  })

  it("creates a lead and returns 201 on a valid payload", async () => {
    const { from, insert } = mockAdminClient({ singleResult: { data: { id: "lead-1" }, error: null } })

    const response = await POST(jsonRequest(validPayload))
    const json = await response.json()

    expect(response.status).toBe(201)
    expect(json).toEqual({ id: "lead-1" })
    expect(from).toHaveBeenCalledWith("leads")
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ ...validPayload, source: "site" }))
  })

  it("returns 400 for malformed JSON without touching the database", async () => {
    mockAdminClient({ singleResult: { data: null, error: null } })

    const request = new Request("http://localhost/api/leads", {
      method: "POST",
      body: "not-json",
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it("returns 400 naming the missing field when a required field is absent", async () => {
    mockAdminClient({ singleResult: { data: null, error: null } })

    const response = await POST(jsonRequest({ ...validPayload, email: "" }))
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.fieldErrors.email).toBeTruthy()
    expect(createAdminClient).not.toHaveBeenCalled()
  })

  it("returns 500 with a generic message when the insert fails", async () => {
    mockAdminClient({ singleResult: { data: null, error: { message: "db exploded" } } })

    const response = await POST(jsonRequest(validPayload))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).not.toMatch(/db exploded/)
  })

  it("returns 500 with a generic message when creating the admin client throws", async () => {
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY")
    })

    const response = await POST(jsonRequest(validPayload))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).not.toMatch(/SUPABASE_SERVICE_ROLE_KEY/)
  })
})
