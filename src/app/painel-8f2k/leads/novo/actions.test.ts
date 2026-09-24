import { beforeEach, describe, expect, it, vi } from "vitest"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"
import { createManualLead } from "./actions"

vi.mock("@/lib/auth/get-current-admin", () => ({
  getCurrentAdmin: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

const validPayload = {
  name: "Erik",
  email: "erik@example.com",
  whatsapp: "11999999999",
  project_type: "site institucional",
  description: "Preciso de um site novo para a empresa.",
  source: "indicação",
}

function formDataOf(payload: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    formData.set(key, value)
  }
  return formData
}

type DuplicateMatch = { id: string; created_at: string } | null

function mockSessionClient({
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

    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockImplementation((column: "email" | "whatsapp") => {
        field = column
        return query
      }),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockImplementation(async () => ({
        data: field === "email" ? duplicateByEmail : duplicateByWhatsapp,
        error: null,
      })),
      insert,
    }

    return query
  })

  vi.mocked(createClient).mockResolvedValue({ from } as never)

  return { from, insert, insertSelect, single }
}

describe("createManualLead", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("returns an error and does not touch the DB when unauthenticated", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await createManualLead(undefined, formDataOf(validPayload))

    expect(result).toEqual({ status: "error", error: expect.any(String) })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns a field-level error when a required field is missing", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const rest = { ...validPayload }
    delete (rest as Partial<typeof validPayload>).source
    const result = await createManualLead(undefined, formDataOf(rest))

    expect(result?.status).toBe("error")
    if (result?.status === "error") {
      expect(result.fieldErrors?.source).toBeTruthy()
    }
    expect(createClient).not.toHaveBeenCalled()
  })

  it("creates a lead with created_by set to the admin id on valid input", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ singleResult: { data: { id: "lead-1" }, error: null } })

    const result = await createManualLead(undefined, formDataOf(validPayload))

    expect(result).toEqual({ status: "success", id: "lead-1" })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: validPayload.name,
        source: validPayload.source,
        created_by: "admin-1",
        possible_duplicate_of: null,
      })
    )
  })

  it("flags possible_duplicate_of when a matching lead exists", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    const { insert } = mockSessionClient({
      singleResult: { data: { id: "lead-2" }, error: null },
      duplicateByEmail: { id: "lead-original", created_at: "2026-01-01T00:00:00Z" },
    })

    const result = await createManualLead(undefined, formDataOf(validPayload))

    expect(result).toEqual({ status: "success", id: "lead-2" })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ possible_duplicate_of: "lead-original" })
    )
  })

  it("flags possible_duplicate_of when only whatsapp matches", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({
      singleResult: { data: { id: "lead-3" }, error: null },
      duplicateByWhatsapp: { id: "lead-whatsapp-original", created_at: "2026-01-01T00:00:00Z" },
    })

    const result = await createManualLead(undefined, formDataOf(validPayload))

    expect(result).toEqual({ status: "success", id: "lead-3" })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ possible_duplicate_of: "lead-whatsapp-original" })
    )
  })

  it("returns a generic error when the insert fails", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockSessionClient({ singleResult: { data: null, error: { message: "RLS denied" } } })

    const result = await createManualLead(undefined, formDataOf(validPayload))

    expect(result).toEqual({
      status: "error",
      error: "Não foi possível registrar o lead. Tente novamente.",
    })
  })
})
