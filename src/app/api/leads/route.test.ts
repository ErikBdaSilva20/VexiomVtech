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

type DuplicateMatch = { id: string; created_at: string } | null

function mockAdminClient({
  singleResult,
  duplicateByEmail = null,
  duplicateByWhatsapp = null,
}: {
  singleResult: { data: { id: string } | null; error: unknown }
  duplicateByEmail?: DuplicateMatch
  duplicateByWhatsapp?: DuplicateMatch
}) {
  const single = vi.fn().mockResolvedValue(singleResult)
  const insertSelect = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select: insertSelect })

  const from = vi.fn().mockImplementation(() => {
    let field: "email" | "whatsapp" | undefined

    const duplicateQuery = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((column: "email" | "whatsapp") => {
        field = column
        return duplicateQuery
      }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(async () => ({
        data: field === "email" ? duplicateByEmail : duplicateByWhatsapp,
        error: null,
      })),
      insert,
    }

    return duplicateQuery
  })

  vi.mocked(createAdminClient).mockReturnValue({ from } as never)

  return { from, insert, insertSelect, single }
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
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ ...validPayload, source: "site", possible_duplicate_of: null })
    )
  })

  it("sets possible_duplicate_of to the oldest matching lead's id", async () => {
    const { insert } = mockAdminClient({
      singleResult: { data: { id: "lead-2" }, error: null },
      duplicateByEmail: { id: "lead-original", created_at: "2026-01-01T00:00:00Z" },
    })

    const response = await POST(jsonRequest(validPayload))

    expect(response.status).toBe(201)
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ possible_duplicate_of: "lead-original" })
    )
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

  it("returns 500 with a generic message when the duplicate check throws unexpectedly", async () => {
    const from = vi.fn().mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockRejectedValue(new Error("network error")),
    }))
    vi.mocked(createAdminClient).mockReturnValue({ from } as never)

    const response = await POST(jsonRequest(validPayload))
    const json = await response.json()

    expect(response.status).toBe(500)
    expect(json.error).not.toMatch(/network error/)
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
