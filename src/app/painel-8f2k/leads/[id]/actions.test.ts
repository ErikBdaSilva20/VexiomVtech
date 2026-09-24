import { beforeEach, describe, expect, it, vi } from "vitest"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"
import { createLeadInteraction } from "./actions"

vi.mock("@/lib/auth/get-current-admin", () => ({
  getCurrentAdmin: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

const validPayload = {
  lead_id: "11111111-1111-4111-8111-111111111111",
  type: "nota",
  content: "Cliente pediu orçamento revisado.",
}

function formDataOf(payload: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    formData.set(key, value)
  }
  return formData
}

function mockSessionClient(singleResult: { data: { id: string } | null; error: unknown }) {
  const single = vi.fn().mockResolvedValue(singleResult)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  const from = vi.fn().mockReturnValue({ insert })

  vi.mocked(createClient).mockResolvedValue({ from } as never)

  return { from, insert }
}

describe("createLeadInteraction", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("returns an error and does not touch the DB when unauthenticated", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await createLeadInteraction(undefined, formDataOf(validPayload))

    expect(result).toEqual({ status: "error", error: expect.any(String) })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns a field-level error when content is missing", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const rest = { ...validPayload, content: "" }
    const result = await createLeadInteraction(undefined, formDataOf(rest))

    expect(result?.status).toBe("error")
    if (result?.status === "error") {
      expect(result.fieldErrors?.content).toBeTruthy()
    }
    expect(createClient).not.toHaveBeenCalled()
  })

  it("rejects type mudanca_status as a field-level error", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await createLeadInteraction(
      undefined,
      formDataOf({ ...validPayload, type: "mudanca_status" })
    )

    expect(result?.status).toBe("error")
    if (result?.status === "error") {
      expect(result.fieldErrors?.type).toBeTruthy()
    }
  })

  it("attributes a nota entry to the admin's id", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "int-1" }, error: null })

    const result = await createLeadInteraction(undefined, formDataOf(validPayload))

    expect(result).toEqual({ status: "success", id: "int-1" })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "nota", author_id: "admin-1" })
    )
  })

  it("attributes a mensagem_enviada entry to the admin's id", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "int-2" }, error: null })

    await createLeadInteraction(
      undefined,
      formDataOf({ ...validPayload, type: "mensagem_enviada" })
    )

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "mensagem_enviada", author_id: "admin-1" })
    )
  })

  it("never attributes a mensagem_recebida entry to an admin", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "int-3" }, error: null })

    await createLeadInteraction(
      undefined,
      formDataOf({ ...validPayload, type: "mensagem_recebida" })
    )

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "mensagem_recebida", author_id: null })
    )
  })

  it("uses the provided occurred_at for a retroactive entry", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "int-4" }, error: null })

    await createLeadInteraction(
      undefined,
      formDataOf({ ...validPayload, occurred_at: "2026-01-01T10:00:00Z" })
    )

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ occurred_at: "2026-01-01T10:00:00Z" })
    )
  })

  it("defaults occurred_at to now when omitted", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "int-5" }, error: null })

    const before = Date.now()
    await createLeadInteraction(undefined, formDataOf(validPayload))
    const after = Date.now()

    const insertedAt = insert.mock.calls[0][0].occurred_at as string
    const insertedTime = new Date(insertedAt).getTime()
    expect(insertedTime).toBeGreaterThanOrEqual(before)
    expect(insertedTime).toBeLessThanOrEqual(after)
  })

  it("returns a generic error when the insert fails", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockSessionClient({ data: null, error: { message: "RLS denied" } })

    const result = await createLeadInteraction(undefined, formDataOf(validPayload))

    expect(result).toEqual({
      status: "error",
      error: "Não foi possível registrar a interação. Tente novamente.",
    })
  })
})
