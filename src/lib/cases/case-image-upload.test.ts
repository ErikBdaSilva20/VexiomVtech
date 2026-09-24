import { describe, expect, it, vi } from "vitest"

import { uploadCaseImage } from "./case-image-upload"

function mockClient(uploadResult: { error: unknown }, publicUrl = "https://cdn.example.com/case-images/x.png") {
  const upload = vi.fn().mockResolvedValue(uploadResult)
  const getPublicUrl = vi.fn().mockReturnValue({ data: { publicUrl } })
  const from = vi.fn().mockReturnValue({ upload, getPublicUrl })
  return { storage: { from } } as never
}

const SIGNATURES: Record<string, number[]> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff, 0xe0],
  "image/webp": [0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50],
}

/** Builds a File with a real signature for `type`, padded to `sizeBytes`. */
function makeFile(name: string, type: string, sizeBytes: number, signature = SIGNATURES[type]): File {
  const content = new Uint8Array(Math.max(sizeBytes, signature?.length ?? 0))
  if (signature) content.set(signature)
  return new File([content], name, { type })
}

describe("uploadCaseImage", () => {
  it("uploads a valid PNG and returns its public URL", async () => {
    const supabase = mockClient({ error: null })
    const file = makeFile("cover.png", "image/png", 1024)

    const result = await uploadCaseImage(supabase, "case-1", file)

    expect(result).toEqual({ ok: true, url: "https://cdn.example.com/case-images/x.png" })
  })

  it("uploads a valid JPEG and WebP", async () => {
    const supabase = mockClient({ error: null })

    expect((await uploadCaseImage(supabase, "case-1", makeFile("a.jpg", "image/jpeg", 1024))).ok).toBe(true)
    expect((await uploadCaseImage(supabase, "case-1", makeFile("a.webp", "image/webp", 1024))).ok).toBe(true)
  })

  it("rejects an empty file", async () => {
    const supabase = mockClient({ error: null })
    const file = new File([], "empty.png", { type: "image/png" })

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
    const file = makeFile("doc.pdf", "application/pdf", 1024, [0x25, 0x50, 0x44, 0x46])

    const result = await uploadCaseImage(supabase, "case-1", file)

    expect(result).toEqual({ ok: false, error: "Formato inválido. Envie PNG, JPG ou WebP." })
  })

  it("rejects a file whose declared type doesn't match its real content (spoofed MIME type)", async () => {
    const supabase = mockClient({ error: null })
    // An HTML payload declaring itself as image/png.
    const htmlBytes = new TextEncoder().encode("<script>alert(1)</script>")
    const file = new File([htmlBytes], "cover.png", { type: "image/png" })

    const result = await uploadCaseImage(supabase, "case-1", file)

    expect(result).toEqual({ ok: false, error: "O arquivo não é uma imagem válida no formato declarado." })
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
