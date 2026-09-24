import { describe, expect, it, vi } from "vitest"

import { updateCase } from "./update-case"
import type { UpdateCaseInput } from "./case-schema"

function mockClient(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const eq = vi.fn().mockReturnValue({ select })
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ update })
  return { from, update, eq, select, single }
}

const input: UpdateCaseInput = {
  case_id: "22222222-2222-4222-8222-222222222222",
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
  published: true,
  display_order: 1,
}

describe("updateCase", () => {
  it("updates the case by id, excluding case_id from the update payload", async () => {
    const { from, update, eq } = mockClient({ data: { id: input.case_id }, error: null })
    const supabase = { from } as never

    const result = await updateCase(supabase, input)

    expect(result).toEqual({ ok: true })
    expect(update).toHaveBeenCalledWith(expect.not.objectContaining({ case_id: expect.anything() }))
    expect(eq).toHaveBeenCalledWith("id", input.case_id)
  })

  it("returns duplicate_slug on a unique violation", async () => {
    const { from } = mockClient({ data: null, error: { code: "23505" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await updateCase(supabase, input)

    expect(result).toEqual({ ok: false, error: "duplicate_slug" })
    consoleSpy.mockRestore()
  })

  it("returns unknown when the case doesn't exist (0 rows, no error)", async () => {
    const { from } = mockClient({ data: null, error: null })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await updateCase(supabase, input)

    expect(result).toEqual({ ok: false, error: "unknown" })
    consoleSpy.mockRestore()
  })
})
