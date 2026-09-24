import { describe, expect, it, vi } from "vitest"

import { appendCaseGalleryImages, setCaseCoverImage } from "./set-case-images"

describe("setCaseCoverImage", () => {
  it("updates cover_image_url by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    const supabase = { from } as never

    const result = await setCaseCoverImage(supabase, "case-1", "https://cdn/x.png")

    expect(result).toEqual({ ok: true })
    expect(update).toHaveBeenCalledWith({ cover_image_url: "https://cdn/x.png" })
    expect(eq).toHaveBeenCalledWith("id", "case-1")
  })

  it("returns ok: false and logs when the update fails", async () => {
    const eq = vi.fn().mockResolvedValue({ error: { message: "db down" } })
    const update = vi.fn().mockReturnValue({ eq })
    const from = vi.fn().mockReturnValue({ update })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await setCaseCoverImage(supabase, "case-1", "https://cdn/x.png")

    expect(result).toEqual({ ok: false })
    consoleSpy.mockRestore()
  })
})

describe("appendCaseGalleryImages", () => {
  function mockClient({
    existingGallery,
    readError = null,
    writeError = null,
  }: {
    existingGallery: string[] | null
    readError?: unknown
    writeError?: unknown
  }) {
    const single = vi.fn().mockResolvedValue({ data: { gallery_urls: existingGallery }, error: readError })
    const eqSelect = vi.fn().mockReturnValue({ single })
    const select = vi.fn().mockReturnValue({ eq: eqSelect })

    const eqUpdate = vi.fn().mockResolvedValue({ error: writeError })
    const update = vi.fn().mockReturnValue({ eq: eqUpdate })

    const from = vi.fn().mockReturnValue({ select, update })
    return { from, select, update, eqUpdate }
  }

  it("returns ok immediately when there are no new urls", async () => {
    const { from, select } = mockClient({ existingGallery: [] })
    const supabase = { from } as never

    const result = await appendCaseGalleryImages(supabase, "case-1", [])

    expect(result).toEqual({ ok: true })
    expect(select).not.toHaveBeenCalled()
  })

  it("appends new urls to the existing gallery", async () => {
    const { from, update } = mockClient({ existingGallery: ["https://cdn/old.png"] })
    const supabase = { from } as never

    const result = await appendCaseGalleryImages(supabase, "case-1", ["https://cdn/new.png"])

    expect(result).toEqual({ ok: true })
    expect(update).toHaveBeenCalledWith({ gallery_urls: ["https://cdn/old.png", "https://cdn/new.png"] })
  })

  it("treats a null existing gallery as empty", async () => {
    const { from, update } = mockClient({ existingGallery: null })
    const supabase = { from } as never

    await appendCaseGalleryImages(supabase, "case-1", ["https://cdn/new.png"])

    expect(update).toHaveBeenCalledWith({ gallery_urls: ["https://cdn/new.png"] })
  })

  it("returns ok: false and logs when the read fails", async () => {
    const { from } = mockClient({ existingGallery: null, readError: { message: "db down" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await appendCaseGalleryImages(supabase, "case-1", ["https://cdn/new.png"])

    expect(result).toEqual({ ok: false })
    consoleSpy.mockRestore()
  })

  it("returns ok: false and logs when the write fails", async () => {
    const { from } = mockClient({ existingGallery: [], writeError: { message: "db down" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await appendCaseGalleryImages(supabase, "case-1", ["https://cdn/new.png"])

    expect(result).toEqual({ ok: false })
    consoleSpy.mockRestore()
  })
})
