import { beforeEach, describe, expect, it, vi } from "vitest"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createCase } from "@/lib/cases/create-case"
import { updateCase } from "@/lib/cases/update-case"

import { createCaseAction, updateCaseAction } from "./actions"

vi.mock("@/lib/auth/get-current-admin", () => ({
  getCurrentAdmin: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/cases/create-case", () => ({
  createCase: vi.fn(),
}))

vi.mock("@/lib/cases/update-case", () => ({
  updateCase: vi.fn(),
}))

function validFormData(overrides: Record<string, string> = {}) {
  const data = new FormData()
  const fields: Record<string, string> = {
    title: "Projeto X",
    slug: "projeto-x",
    category: "Sistema sob medida",
    description: "Descrição",
    problem_solved: "Resolveu",
    motivation: "Motivação",
    tech_stack: "Next.js",
    display_order: "0",
    ...overrides,
  }
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

beforeEach(() => {
  vi.mocked(getCurrentAdmin).mockReset()
  vi.mocked(createCase).mockReset()
  vi.mocked(updateCase).mockReset()
})

describe("createCaseAction", () => {
  it("rejects when there is no session", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await createCaseAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "Sessão expirada. Faça login novamente." })
    expect(createCase).not.toHaveBeenCalled()
  })

  it("rejects a non-super_admin, even with a valid session (defense in depth alongside RLS)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await createCaseAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "Apenas super_admin pode gerenciar cases." })
    expect(createCase).not.toHaveBeenCalled()
  })

  it("returns field errors for an invalid payload", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })

    const result = await createCaseAction(undefined, validFormData({ title: "" }))

    expect(result?.status).toBe("error")
    expect(createCase).not.toHaveBeenCalled()
  })

  it("creates the case on a valid payload", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createCase).mockResolvedValue({ ok: true, id: "case-1" })

    const result = await createCaseAction(undefined, validFormData())

    expect(result).toEqual({ status: "success", id: "case-1" })
  })

  it("surfaces a specific message for a duplicate slug", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createCase).mockResolvedValue({ ok: false, error: "duplicate_slug" })

    const result = await createCaseAction(undefined, validFormData())

    expect(result).toEqual({
      status: "error",
      error: "Esse endereço (slug) já está em uso por outro case.",
    })
  })

  it("never forwards a client-sent published flag (create is always a draft)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createCase).mockResolvedValue({ ok: true, id: "case-1" })

    await createCaseAction(undefined, validFormData({ published: "on" }))

    expect(createCase).toHaveBeenCalledWith(expect.anything(), expect.not.objectContaining({ published: expect.anything() }))
  })
})

describe("updateCaseAction", () => {
  const caseId = "22222222-2222-4222-8222-222222222222"

  it("rejects a non-super_admin", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await updateCaseAction(undefined, validFormData({ case_id: caseId }))

    expect(result).toEqual({ status: "error", error: "Apenas super_admin pode gerenciar cases." })
    expect(updateCase).not.toHaveBeenCalled()
  })

  it("treats an unchecked published checkbox as false", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(updateCase).mockResolvedValue({ ok: true })

    await updateCaseAction(undefined, validFormData({ case_id: caseId }))

    expect(updateCase).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ published: false }))
  })

  it("treats a checked published checkbox as true", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(updateCase).mockResolvedValue({ ok: true })

    await updateCaseAction(undefined, validFormData({ case_id: caseId, published: "on" }))

    expect(updateCase).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ published: true }))
  })

  it("returns success on a valid update", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(updateCase).mockResolvedValue({ ok: true })

    const result = await updateCaseAction(undefined, validFormData({ case_id: caseId }))

    expect(result).toEqual({ status: "success" })
  })
})
