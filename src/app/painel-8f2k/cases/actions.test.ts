import { beforeEach, describe, expect, it, vi } from "vitest"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { uploadCaseImage } from "@/lib/cases/case-image-upload"
import { createCase } from "@/lib/cases/create-case"
import { appendCaseGalleryImages, setCaseCoverImage } from "@/lib/cases/set-case-images"
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

vi.mock("@/lib/cases/case-image-upload", () => ({
  uploadCaseImage: vi.fn(),
}))

vi.mock("@/lib/cases/set-case-images", () => ({
  setCaseCoverImage: vi.fn(),
  appendCaseGalleryImages: vi.fn(),
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
  vi.mocked(uploadCaseImage).mockReset()
  vi.mocked(setCaseCoverImage).mockReset()
  vi.mocked(appendCaseGalleryImages).mockReset()
})

function makeFile(name: string, type: string, sizeBytes: number): File {
  return new File([new Uint8Array(sizeBytes)], name, { type })
}

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

  it("uploads a provided cover image and saves its URL after creating the case", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createCase).mockResolvedValue({ ok: true, id: "case-1" })
    vi.mocked(uploadCaseImage).mockResolvedValue({ ok: true, url: "https://cdn/cover.png" })
    vi.mocked(setCaseCoverImage).mockResolvedValue({ ok: true })

    const formData = validFormData()
    formData.set("cover_image", makeFile("cover.png", "image/png", 1024))

    const result = await createCaseAction(undefined, formData)

    expect(uploadCaseImage).toHaveBeenCalledWith(expect.anything(), "case-1", expect.any(File))
    expect(setCaseCoverImage).toHaveBeenCalledWith(expect.anything(), "case-1", "https://cdn/cover.png")
    expect(result).toEqual({ status: "success", id: "case-1", imageErrors: undefined })
  })

  it("still returns success for the case when the cover image upload fails, with an imageErrors note", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createCase).mockResolvedValue({ ok: true, id: "case-1" })
    vi.mocked(uploadCaseImage).mockResolvedValue({ ok: false, error: "Formato inválido. Envie PNG, JPG ou WebP." })

    const formData = validFormData()
    formData.set("cover_image", makeFile("cover.pdf", "application/pdf", 1024))

    const result = await createCaseAction(undefined, formData)

    expect(result).toEqual({
      status: "success",
      id: "case-1",
      imageErrors: { cover_image: ["Formato inválido. Envie PNG, JPG ou WebP."] },
    })
  })

  it("does not attempt an upload when no cover image file was selected", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createCase).mockResolvedValue({ ok: true, id: "case-1" })

    const formData = validFormData()
    formData.set("cover_image", makeFile("", "application/octet-stream", 0))

    await createCaseAction(undefined, formData)

    expect(uploadCaseImage).not.toHaveBeenCalled()
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

    expect(result).toEqual({ status: "success", imageErrors: undefined })
  })

  it("uploads new gallery images and appends their URLs", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(updateCase).mockResolvedValue({ ok: true })
    vi.mocked(uploadCaseImage).mockResolvedValue({ ok: true, url: "https://cdn/gallery-1.png" })
    vi.mocked(appendCaseGalleryImages).mockResolvedValue({ ok: true })

    const formData = validFormData({ case_id: caseId })
    formData.append("gallery_images", makeFile("g1.png", "image/png", 1024))
    formData.append("gallery_images", makeFile("g2.png", "image/png", 1024))

    const result = await updateCaseAction(undefined, formData)

    expect(uploadCaseImage).toHaveBeenCalledTimes(2)
    expect(appendCaseGalleryImages).toHaveBeenCalledWith(
      expect.anything(),
      caseId,
      ["https://cdn/gallery-1.png", "https://cdn/gallery-1.png"]
    )
    expect(result).toEqual({ status: "success", imageErrors: undefined })
  })
})
