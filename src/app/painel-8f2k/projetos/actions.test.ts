import { beforeEach, describe, expect, it, vi } from "vitest"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createProject } from "@/lib/projects/create-project"
import { updateProject } from "@/lib/projects/update-project"

import { createProjectAction, updateProjectAction } from "./actions"

vi.mock("@/lib/auth/get-current-admin", () => ({
  getCurrentAdmin: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({}),
}))

vi.mock("@/lib/projects/create-project", () => ({
  createProject: vi.fn(),
}))

vi.mock("@/lib/projects/update-project", () => ({
  updateProject: vi.fn(),
}))

function validFormData(overrides: Record<string, string> = {}) {
  const data = new FormData()
  const fields: Record<string, string> = {
    title: "Projeto X",
    ...overrides,
  }
  for (const [key, value] of Object.entries(fields)) data.set(key, value)
  return data
}

beforeEach(() => {
  vi.mocked(getCurrentAdmin).mockReset()
  vi.mocked(createProject).mockReset()
  vi.mocked(updateProject).mockReset()
})

describe("createProjectAction", () => {
  it("rejects when there is no session", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await createProjectAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "Sessão expirada. Faça login novamente." })
    expect(createProject).not.toHaveBeenCalled()
  })

  it("rejects a non-super_admin, even with a valid session (defense in depth alongside RLS)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await createProjectAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "Apenas super_admin pode gerenciar projetos." })
    expect(createProject).not.toHaveBeenCalled()
  })

  it("returns field errors for an invalid payload", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })

    const result = await createProjectAction(undefined, validFormData({ title: "" }))

    expect(result?.status).toBe("error")
    expect(createProject).not.toHaveBeenCalled()
  })

  it("rejects status concluido without finished_at", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })

    const result = await createProjectAction(undefined, validFormData({ status: "concluido" }))

    expect(result?.status).toBe("error")
    expect(createProject).not.toHaveBeenCalled()
  })

  it("creates the project on a valid payload", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createProject).mockResolvedValue({ ok: true, id: "project-1" })

    const result = await createProjectAction(undefined, validFormData())

    expect(result).toEqual({ status: "success", id: "project-1" })
  })

  it("surfaces a specific message for an invalid lead", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(createProject).mockResolvedValue({ ok: false, error: "invalid_lead" })

    const result = await createProjectAction(undefined, validFormData())

    expect(result).toEqual({ status: "error", error: "O lead selecionado não existe." })
  })
})

describe("updateProjectAction", () => {
  const projectId = "22222222-2222-4222-8222-222222222222"

  it("rejects a non-super_admin", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await updateProjectAction(
      undefined,
      validFormData({ project_id: projectId, status: "em_andamento" })
    )

    expect(result).toEqual({ status: "error", error: "Apenas super_admin pode gerenciar projetos." })
    expect(updateProject).not.toHaveBeenCalled()
  })

  it("returns success on a valid update", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(updateProject).mockResolvedValue({ ok: true })

    const result = await updateProjectAction(
      undefined,
      validFormData({ project_id: projectId, status: "em_andamento" })
    )

    expect(result).toEqual({ status: "success" })
  })

  it("persists finished_at when marking a project concluido", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    vi.mocked(updateProject).mockResolvedValue({ ok: true })

    await updateProjectAction(
      undefined,
      validFormData({ project_id: projectId, status: "concluido", finished_at: "2026-01-01" })
    )

    expect(updateProject).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ status: "concluido", finished_at: "2026-01-01" })
    )
  })
})
