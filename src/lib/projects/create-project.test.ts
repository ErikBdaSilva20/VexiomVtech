import { describe, expect, it, vi } from "vitest"

import { createProject } from "./create-project"
import type { CreateProjectInput } from "./project-schema"

function mockClient(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  const from = vi.fn().mockReturnValue({ insert })
  return { from, insert, select, single }
}

const input: CreateProjectInput = {
  title: "Projeto X",
  client_name: null,
  lead_id: null,
  status: "em_andamento",
  started_at: null,
  finished_at: null,
}

describe("createProject", () => {
  it("inserts and returns the new id", async () => {
    const { from, insert } = mockClient({ data: { id: "project-1" }, error: null })
    const supabase = { from } as never

    const result = await createProject(supabase, input)

    expect(result).toEqual({ ok: true, id: "project-1" })
    expect(insert).toHaveBeenCalledWith(input)
  })

  it("returns invalid_lead on a foreign key violation", async () => {
    const { from } = mockClient({ data: null, error: { code: "23503" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createProject(supabase, input)

    expect(result).toEqual({ ok: false, error: "invalid_lead" })
    consoleSpy.mockRestore()
  })

  it("returns unknown on any other error", async () => {
    const { from } = mockClient({ data: null, error: { code: "99999" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await createProject(supabase, input)

    expect(result).toEqual({ ok: false, error: "unknown" })
    consoleSpy.mockRestore()
  })
})
