import { describe, expect, it, vi } from "vitest"

import { createCase } from "./create-case"
import type { CreateCaseInput } from "./case-schema"

function mockClient(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  const from = vi.fn().mockReturnValue({ insert })
  return { from, insert, select, single }
}

const input: CreateCaseInput = {
  title: "Projeto X",
  slug: "projeto-x",
  category: "Sistema sob medida",
  client_name: null,
  project_id: null,
  description: "Descrição",
  problem_solved: "Resolveu",
  motivation: "Motivação",
  external_link: null,
  tech_stack: ["Next.js"],
  is_founder_project: false,
  display_order: 0,
}

describe("createCase", () => {
  it("inserts with published forced to false, regardless of what's passed", async () => {
    const { from, insert } = mockClient({ data: { id: "case-1" }, error: null })
    const supabase = { from } as never

    const result = await createCase(supabase, input)

    expect(result).toEqual({ ok: true, id: "case-1" })
    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ published: false }))
  })

  it("returns duplicate_slug on a unique violation", async () => {
    const { from } = mockClient({ data: null, error: { code: "23505" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createCase(supabase, input)

    expect(result).toEqual({ ok: false, error: "duplicate_slug" })
    consoleSpy.mockRestore()
  })

  it("returns invalid_project on a foreign key violation", async () => {
    const { from } = mockClient({ data: null, error: { code: "23503" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createCase(supabase, input)

    expect(result).toEqual({ ok: false, error: "invalid_project" })
    consoleSpy.mockRestore()
  })

  it("returns unknown on any other error", async () => {
    const { from } = mockClient({ data: null, error: { code: "99999" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createCase(supabase, input)

    expect(result).toEqual({ ok: false, error: "unknown" })
    consoleSpy.mockRestore()
  })
})
