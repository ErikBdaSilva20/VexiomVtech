import { describe, expect, it, vi } from "vitest"

import { uploadCaseImage } from "./case-image-upload"

function mockClient(uploadResult: { error: unknown }, publicUrl = "https://cdn.example.com/case-images/x.png") {
  const upload = vi.fn().mockResolvedValue(uploadResult)
  const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl } })
  const from = vi.fn().mockReturnValue({ upload, getPublicUrl })
  return { storage: { from } } as never
}

function makeFile(name: string, type: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

describe("uploadCaseImage", () => {
  it("uploads a valid PNG and returns its public URL", async () => {
    const supabase = mockClient({ error: null })
    const file = makeFile("cover.png", "image/png", 1024)

    const result = await uploadCaseImage(supabase, "case-1", file)

    expect(result).toEqual({ ok: true, url: "https://cdn.example.com/case-images/x.png" })
  })

  it("rejects an empty file", async () => {
    const supabase = mockClient({ error: null })
    const file = makeFile("empty.png", "image/png", 0)

    const result = await uploadCaseImage(supabase, "case-1", file)

    expect(result).toEqual({ ok: false, error: "Nenhum arquivo selecionado." })
  })

  it("rejects a file over 5MB", async () => {
    const supabase = mockClient({ error: null })
    const file = makeFile("huge.png", "image/png", 5 * 1024 * 1024 + 1)

    const result = await uploadCaseImage(supabase, "case-1", file)

    expect(result).toEqual({ ok: false, error: "A imagem deve ter no máximo 5MB." })
  })

  it("rejects a disallowed mime type", async () => {
    const supabase = mockClient({ error: null })
    const file = makeFile("doc.pdf", "application/pdf", 1024)

    const result = await uploadCaseImage(supabase, "case-1", file)

    expect(result).toEqual({ ok: false, error: "Formato inválido. Envie PNG, JPG ou WebP." })
  })

  it("returns a generic error and logs when the storage upload fails", async () => {
    const supabase = mockClient({ error: { message: "bucket down" } })
    const file = makeFile("cover.png", "image/png", 1024)
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await uploadCaseImage(supabase, "case-1", file)

    expect(result).toEqual({ ok: false, error: "Não foi possível enviar a imagem." })
    consoleSpy.mockRestore()
  })
})
