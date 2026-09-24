import { describe, expect, it, vi } from "vitest"

import { updateProject } from "./update-project"
import type { UpdateProjectInput } from "./project-schema"

function mockClient(result: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(result)
  const select = vi.fn().mockReturnValue({ single })
  const eq = vi.fn().mockReturnValue({ select })
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ update })
  return { from, update, eq, select, single }
}

const input: UpdateProjectInput = {
  project_id: "22222222-2222-4222-8222-222222222222",
  title: "Projeto X",
  client_name: null,
  lead_id: null,
  status: "concluido",
  started_at: null,
  finished_at: "2026-01-01",
}

describe("updateProject", () => {
  it("updates the project by id, excluding project_id from the update payload, persisting finished_at", async () => {
    const { from, update, eq } = mockClient({ data: { id: input.project_id }, error: null })
    const supabase = { from } as never

    const result = await updateProject(supabase, input)

    expect(result).toEqual({ ok: true })
    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({ project_id: expect.anything() })
    )
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ finished_at: "2026-01-01" }))
    expect(eq).toHaveBeenCalledWith("id", input.project_id)
  })

  it("returns invalid_lead on a foreign key violation", async () => {
    const { from } = mockClient({ data: null, error: { code: "23503" } })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await updateProject(supabase, input)

    expect(result).toEqual({ ok: false, error: "invalid_lead" })
    consoleSpy.mockRestore()
  })

  it("returns unknown when the project doesn't exist (0 rows, no error)", async () => {
    const { from } = mockClient({ data: null, error: null })
    const supabase = { from } as never
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

    const result = await updateProject(supabase, input)

    expect(result).toEqual({ ok: false, error: "unknown" })
    consoleSpy.mockRestore()
  })
})
