import { beforeEach, describe, expect, it, vi } from "vitest"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"
import {
  createLeadInteraction,
  createLeadMeeting,
  markLeadResponded,
  updateLeadAssignee,
  updateLeadMeetingStatus,
  updateLeadNextAction,
  updateLeadNonConversionReason,
  updateLeadProbability,
  updateLeadStatus,
  updateLeadTags,
} from "./actions"

vi.mock("@/lib/auth/get-current-admin", () => ({
  getCurrentAdmin: vi.fn(),
}))

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

const validPayload = {
  lead_id: "11111111-1111-4111-8111-111111111111",
  type: "nota",
  content: "Cliente pediu orçamento revisado.",
}

function formDataOf(payload: Record<string, string>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    formData.set(key, value)
  }
  return formData
}

function mockSessionClient(singleResult: { data: { id: string } | null; error: unknown }) {
  const single = vi.fn().mockResolvedValue(singleResult)
  const select = vi.fn().mockReturnValue({ single })
  const insert = vi.fn().mockReturnValue({ select })
  const from = vi.fn().mockReturnValue({ insert })

  vi.mocked(createClient).mockResolvedValue({ from } as never)

  return { from, insert }
}

describe("createLeadInteraction", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("returns an error and does not touch the DB when unauthenticated", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await createLeadInteraction(undefined, formDataOf(validPayload))

    expect(result).toEqual({ status: "error", error: expect.any(String) })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns a field-level error when content is missing", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const rest = { ...validPayload, content: "" }
    const result = await createLeadInteraction(undefined, formDataOf(rest))

    expect(result?.status).toBe("error")
    if (result?.status === "error") {
      expect(result.fieldErrors?.content).toBeTruthy()
    }
    expect(createClient).not.toHaveBeenCalled()
  })

  it("rejects type mudanca_status as a field-level error", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await createLeadInteraction(
      undefined,
      formDataOf({ ...validPayload, type: "mudanca_status" })
    )

    expect(result?.status).toBe("error")
    if (result?.status === "error") {
      expect(result.fieldErrors?.type).toBeTruthy()
    }
  })

  it("attributes a nota entry to the admin's id", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "int-1" }, error: null })

    const result = await createLeadInteraction(undefined, formDataOf(validPayload))

    expect(result).toEqual({ status: "success", id: "int-1" })
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "nota", author_id: "admin-1" })
    )
  })

  it("attributes a mensagem_enviada entry to the admin's id", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "super_admin", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "int-2" }, error: null })

    await createLeadInteraction(
      undefined,
      formDataOf({ ...validPayload, type: "mensagem_enviada" })
    )

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "mensagem_enviada", author_id: "admin-1" })
    )
  })

  it("never attributes a mensagem_recebida entry to an admin", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "int-3" }, error: null })

    await createLeadInteraction(
      undefined,
      formDataOf({ ...validPayload, type: "mensagem_recebida" })
    )

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ type: "mensagem_recebida", author_id: null })
    )
  })

  it("uses the provided occurred_at for a retroactive entry", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "int-4" }, error: null })

    await createLeadInteraction(
      undefined,
      formDataOf({ ...validPayload, occurred_at: "2026-01-01T10:00:00Z" })
    )

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ occurred_at: "2026-01-01T10:00:00Z" })
    )
  })

  it("defaults occurred_at to now when omitted", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "int-5" }, error: null })

    const before = Date.now()
    await createLeadInteraction(undefined, formDataOf(validPayload))
    const after = Date.now()

    const insertedAt = insert.mock.calls[0][0].occurred_at as string
    const insertedTime = new Date(insertedAt).getTime()
    expect(insertedTime).toBeGreaterThanOrEqual(before)
    expect(insertedTime).toBeLessThanOrEqual(after)
  })

  it("returns a generic error when the insert fails", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockSessionClient({ data: null, error: { message: "RLS denied" } })

    const result = await createLeadInteraction(undefined, formDataOf(validPayload))

    expect(result).toEqual({
      status: "error",
      error: "Não foi possível registrar a interação. Tente novamente.",
    })
  })
})

function leadIdFormData(leadId: string) {
  const formData = new FormData()
  formData.set("lead_id", leadId)
  return formData
}

function mockUpdateClient(singleResult: { data: { id: string } | null; error: unknown }) {
  const single = vi.fn().mockResolvedValue(singleResult)
  const select = vi.fn().mockReturnValue({ single })
  const eq = vi.fn().mockReturnValue({ select })
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ update })

  vi.mocked(createClient).mockResolvedValue({ from } as never)

  return { from, update, eq }
}

describe("markLeadResponded", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("returns an error and does not touch the DB when unauthenticated", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await markLeadResponded(
      undefined,
      leadIdFormData("11111111-1111-4111-8111-111111111111")
    )

    expect(result).toEqual({ status: "error", error: expect.any(String) })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns an error and does not touch the DB when lead_id is not a UUID", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await markLeadResponded(undefined, leadIdFormData("not-a-uuid"))

    expect(result).toEqual({ status: "error", error: "Lead inválido." })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("sets responded_at to the current time on success", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const leadId = "11111111-1111-4111-8111-111111111111"
    const { update, eq } = mockUpdateClient({ data: { id: leadId }, error: null })

    const before = Date.now()
    const result = await markLeadResponded(undefined, leadIdFormData(leadId))
    const after = Date.now()

    expect(result).toEqual({ status: "success" })
    expect(eq).toHaveBeenCalledWith("id", leadId)
    const respondedAt = update.mock.calls[0][0].responded_at as string
    const respondedTime = new Date(respondedAt).getTime()
    expect(respondedTime).toBeGreaterThanOrEqual(before)
    expect(respondedTime).toBeLessThanOrEqual(after)
  })

  it("returns a generic error when the update fails", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockUpdateClient({ data: null, error: { message: "RLS denied" } })

    const result = await markLeadResponded(
      undefined,
      leadIdFormData("11111111-1111-4111-8111-111111111111")
    )

    expect(result).toEqual({
      status: "error",
      error: "Não foi possível marcar o lead como respondido. Tente novamente.",
    })
  })

  it("returns a generic error when no lead matches (0 rows updated)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockUpdateClient({ data: null, error: null })

    const result = await markLeadResponded(
      undefined,
      leadIdFormData("11111111-1111-4111-8111-111111111111")
    )

    expect(result).toEqual({
      status: "error",
      error: "Não foi possível marcar o lead como respondido. Tente novamente.",
    })
  })
})

const NO_ROWS_ERROR = { code: "PGRST116", message: "no rows" }

function statusFormData(payload: { lead_id: string; status: string; expected_status: string }) {
  const formData = new FormData()
  formData.set("lead_id", payload.lead_id)
  formData.set("status", payload.status)
  formData.set("expected_status", payload.expected_status)
  return formData
}

/**
 * Shared shape for any "conditional UPDATE + fallback SELECT" action
 * (updateLeadStatus's expected_status, updateLeadAssignee's
 * expected_assigned_to): `.update().eq().eq().select().single()` for the
 * write, `.select().eq().maybeSingle()` for the conflict-resolution read.
 */
function mockConditionalUpdateClient<TSelectRow extends Record<string, unknown>>({
  updateResult,
  selectResult,
}: {
  updateResult: { data: { id: string } | null; error: unknown }
  selectResult?: { data: TSelectRow | null; error: unknown }
}) {
  const updateSingle = vi.fn().mockResolvedValue(updateResult)
  const updateSelect = vi.fn().mockReturnValue({ single: updateSingle })
  // `.eq(...)` and `.is(...)` are two different ways to add the second
  // condition (expected_status/expected_assigned_to) — updateLeadAssignee
  // picks one or the other depending on whether the expected value is
  // null, so both must lead to the same select chain here.
  const updateEqStatus = vi.fn().mockReturnValue({ select: updateSelect })
  const updateIsStatus = vi.fn().mockReturnValue({ select: updateSelect })
  const updateEqId = vi.fn().mockReturnValue({ eq: updateEqStatus, is: updateIsStatus })
  const update = vi.fn().mockReturnValue({ eq: updateEqId })

  const selectMaybeSingle = vi.fn().mockResolvedValue(selectResult ?? { data: null, error: null })
  const selectEq = vi.fn().mockReturnValue({ maybeSingle: selectMaybeSingle })
  const select = vi.fn().mockReturnValue({ eq: selectEq })

  const from = vi.fn().mockReturnValue({ update, select })

  vi.mocked(createClient).mockResolvedValue({ from } as never)

  return { from, update, updateEqId, updateEqStatus, updateIsStatus, select, selectEq }
}

const validLeadId = "11111111-1111-4111-8111-111111111111"

describe("updateLeadStatus", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("returns an error and does not touch the DB when unauthenticated", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await updateLeadStatus(
      undefined,
      statusFormData({ lead_id: validLeadId, status: "em_analise", expected_status: "novo_lead" })
    )

    expect(result).toEqual({ status: "error", error: expect.any(String) })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns a field-level error for a status outside the enum", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await updateLeadStatus(
      undefined,
      statusFormData({ lead_id: validLeadId, status: "inventado", expected_status: "novo_lead" })
    )

    expect(result?.status).toBe("error")
    if (result?.status === "error") {
      expect(result.fieldErrors?.status).toBeTruthy()
    }
    expect(createClient).not.toHaveBeenCalled()
  })

  it("updates the status when expected_status matches the DB (conditional update wins)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { update, updateEqId, updateEqStatus } = mockConditionalUpdateClient({
      updateResult: { data: { id: validLeadId }, error: null },
    })

    const result = await updateLeadStatus(
      undefined,
      statusFormData({ lead_id: validLeadId, status: "em_analise", expected_status: "novo_lead" })
    )

    expect(result).toEqual({ status: "success" })
    expect(update).toHaveBeenCalledWith({ status: "em_analise" })
    expect(updateEqId).toHaveBeenCalledWith("id", validLeadId)
    expect(updateEqStatus).toHaveBeenCalledWith("status", "novo_lead")
  })

  it("reports a conflict (not a silent overwrite) when another admin already changed the status", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockConditionalUpdateClient({
      updateResult: { data: null, error: NO_ROWS_ERROR },
      selectResult: { data: { status: "proposta_enviada" }, error: null },
    })

    const result = await updateLeadStatus(
      undefined,
      statusFormData({ lead_id: validLeadId, status: "em_analise", expected_status: "novo_lead" })
    )

    expect(result).toEqual({ status: "conflict", currentStatus: "proposta_enviada" })
  })

  it("returns a generic error when the lead doesn't exist at all", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockConditionalUpdateClient({
      updateResult: { data: null, error: NO_ROWS_ERROR },
      selectResult: { data: null, error: null },
    })

    const result = await updateLeadStatus(
      undefined,
      statusFormData({ lead_id: validLeadId, status: "em_analise", expected_status: "novo_lead" })
    )

    expect(result).toEqual({ status: "error", error: "Não foi possível alterar o status. Tente novamente." })
  })

  it("returns a generic error on a real DB failure during the update (not a conflict)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockConditionalUpdateClient({
      updateResult: { data: null, error: { code: "42501", message: "RLS denied" } },
    })

    const result = await updateLeadStatus(
      undefined,
      statusFormData({ lead_id: validLeadId, status: "em_analise", expected_status: "novo_lead" })
    )

    expect(result).toEqual({ status: "error", error: "Não foi possível alterar o status. Tente novamente." })
  })

  it("never inserts into lead_interactions itself — the DB trigger owns that", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { from } = mockConditionalUpdateClient({ updateResult: { data: { id: validLeadId }, error: null } })

    await updateLeadStatus(
      undefined,
      statusFormData({ lead_id: validLeadId, status: "em_analise", expected_status: "novo_lead" })
    )

    expect(from).not.toHaveBeenCalledWith("lead_interactions")
  })
})

function qualificationFormData(payload: Record<string, string | string[]>) {
  const formData = new FormData()
  for (const [key, value] of Object.entries(payload)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        formData.append(key, item)
      }
    } else {
      formData.set(key, value)
    }
  }
  return formData
}

describe("updateLeadNextAction", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("returns an error when unauthenticated", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await updateLeadNextAction(
      undefined,
      qualificationFormData({ lead_id: validLeadId, next_action: "Ligar", next_action_at: "2026-10-01T10:00:00Z" })
    )

    expect(result).toEqual({ status: "error", error: expect.any(String) })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("saves next_action and next_action_at together on success", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { update } = mockUpdateClient({ data: { id: validLeadId }, error: null })

    const result = await updateLeadNextAction(
      undefined,
      qualificationFormData({
        lead_id: validLeadId,
        next_action: "Ligar",
        next_action_at: "2026-10-01T10:00:00Z",
      })
    )

    expect(result).toEqual({ status: "success" })
    expect(update).toHaveBeenCalledWith({
      next_action: "Ligar",
      next_action_at: "2026-10-01T10:00:00Z",
    })
  })

  it("clears both fields when submitted empty", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { update } = mockUpdateClient({ data: { id: validLeadId }, error: null })

    await updateLeadNextAction(
      undefined,
      qualificationFormData({ lead_id: validLeadId, next_action: "", next_action_at: "" })
    )

    expect(update).toHaveBeenCalledWith({ next_action: null, next_action_at: null })
  })

  it("returns a field-level error for a malformed next_action_at", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await updateLeadNextAction(
      undefined,
      qualificationFormData({ lead_id: validLeadId, next_action: "Ligar", next_action_at: "not-a-date" })
    )

    expect(result?.status).toBe("error")
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns a generic error when the update fails", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockUpdateClient({ data: null, error: { message: "RLS denied" } })

    const result = await updateLeadNextAction(
      undefined,
      qualificationFormData({ lead_id: validLeadId, next_action: "Ligar", next_action_at: "" })
    )

    expect(result).toEqual({ status: "error", error: "Não foi possível salvar a próxima ação. Tente novamente." })
  })
})

describe("updateLeadProbability", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("saves a valid probability", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { update } = mockUpdateClient({ data: { id: validLeadId }, error: null })

    const result = await updateLeadProbability(
      undefined,
      qualificationFormData({ lead_id: validLeadId, probability: "alta" })
    )

    expect(result).toEqual({ status: "success" })
    expect(update).toHaveBeenCalledWith({ probability: "alta" })
  })

  it("rejects a probability outside baixa/media/alta", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await updateLeadProbability(
      undefined,
      qualificationFormData({ lead_id: validLeadId, probability: "altissima" })
    )

    expect(result?.status).toBe("error")
    expect(createClient).not.toHaveBeenCalled()
  })
})

describe("updateLeadTags", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("replaces the full tag list", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { update } = mockUpdateClient({ data: { id: validLeadId }, error: null })

    const result = await updateLeadTags(
      undefined,
      qualificationFormData({ lead_id: validLeadId, tags: ["urgente", "vip"] })
    )

    expect(result).toEqual({ status: "success" })
    expect(update).toHaveBeenCalledWith({ tags: ["urgente", "vip"] })
  })

  it("accepts clearing all tags (empty list)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { update } = mockUpdateClient({ data: { id: validLeadId }, error: null })

    await updateLeadTags(undefined, qualificationFormData({ lead_id: validLeadId, tags: [] }))

    expect(update).toHaveBeenCalledWith({ tags: [] })
  })

  it("rejects an empty-string tag", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await updateLeadTags(
      undefined,
      qualificationFormData({ lead_id: validLeadId, tags: [""] })
    )

    expect(result?.status).toBe("error")
    expect(createClient).not.toHaveBeenCalled()
  })
})

describe("updateLeadNonConversionReason", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("saves a reason", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { update } = mockUpdateClient({ data: { id: validLeadId }, error: null })

    const result = await updateLeadNonConversionReason(
      undefined,
      qualificationFormData({ lead_id: validLeadId, non_conversion_reason: "Fechou com concorrente" })
    )

    expect(result).toEqual({ status: "success" })
    expect(update).toHaveBeenCalledWith({ non_conversion_reason: "Fechou com concorrente" })
  })

  it("clears the reason when submitted empty", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { update } = mockUpdateClient({ data: { id: validLeadId }, error: null })

    await updateLeadNonConversionReason(
      undefined,
      qualificationFormData({ lead_id: validLeadId, non_conversion_reason: "" })
    )

    expect(update).toHaveBeenCalledWith({ non_conversion_reason: null })
  })
})

const adminId = "22222222-2222-4222-8222-222222222222"
const otherAdminId = "33333333-3333-4333-8333-333333333333"

describe("updateLeadAssignee", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("returns an error and does not touch the DB when unauthenticated", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await updateLeadAssignee(
      undefined,
      qualificationFormData({ lead_id: validLeadId, assigned_to: adminId, expected_assigned_to: "" })
    )

    expect(result).toEqual({ status: "error", error: expect.any(String) })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("assigns an unassigned lead when expected_assigned_to is empty (null)", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { updateEqId, updateEqStatus: updateEqExpected, updateIsStatus } = mockConditionalUpdateClient({
      updateResult: { data: { id: validLeadId }, error: null },
    })

    const result = await updateLeadAssignee(
      undefined,
      qualificationFormData({ lead_id: validLeadId, assigned_to: adminId, expected_assigned_to: "" })
    )

    expect(result).toEqual({ status: "success" })
    expect(updateEqId).toHaveBeenCalledWith("id", validLeadId)
    // expected_assigned_to === null routes through .is(), not .eq() — see actions.ts.
    expect(updateIsStatus).toHaveBeenCalledWith("assigned_to", null)
    expect(updateEqExpected).not.toHaveBeenCalled()
  })

  it("reassigns when expected_assigned_to matches the current owner", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { updateEqStatus: updateEqExpected } = mockConditionalUpdateClient({
      updateResult: { data: { id: validLeadId }, error: null },
    })

    const result = await updateLeadAssignee(
      undefined,
      qualificationFormData({
        lead_id: validLeadId,
        assigned_to: otherAdminId,
        expected_assigned_to: adminId,
      })
    )

    expect(result).toEqual({ status: "success" })
    expect(updateEqExpected).toHaveBeenCalledWith("assigned_to", adminId)
  })

  it("reports a conflict when another admin already claimed the lead", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockConditionalUpdateClient({
      updateResult: { data: null, error: NO_ROWS_ERROR },
      selectResult: { data: { assigned_to: otherAdminId }, error: null },
    })

    const result = await updateLeadAssignee(
      undefined,
      qualificationFormData({ lead_id: validLeadId, assigned_to: adminId, expected_assigned_to: "" })
    )

    expect(result).toEqual({ status: "conflict", currentAssignedTo: otherAdminId })
  })

  it("returns a generic error when the lead doesn't exist", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockConditionalUpdateClient({
      updateResult: { data: null, error: NO_ROWS_ERROR },
      selectResult: { data: null, error: null },
    })

    const result = await updateLeadAssignee(
      undefined,
      qualificationFormData({ lead_id: validLeadId, assigned_to: adminId, expected_assigned_to: "" })
    )

    expect(result).toEqual({ status: "error", error: "Não foi possível salvar o responsável. Tente novamente." })
  })
})

describe("createLeadMeeting", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("returns an error and does not touch the DB when unauthenticated", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await createLeadMeeting(
      undefined,
      qualificationFormData({ lead_id: validLeadId, scheduled_at: "2026-10-01T14:00:00Z" })
    )

    expect(result).toEqual({ status: "error", error: expect.any(String) })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("creates a meeting with the given schedule and notes", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "meeting-1" }, error: null })

    const result = await createLeadMeeting(
      undefined,
      qualificationFormData({
        lead_id: validLeadId,
        scheduled_at: "2026-10-01T14:00:00Z",
        notes: "Kickoff",
      })
    )

    expect(result).toEqual({ status: "success", id: "meeting-1" })
    expect(insert).toHaveBeenCalledWith({
      lead_id: validLeadId,
      scheduled_at: "2026-10-01T14:00:00Z",
      notes: "Kickoff",
    })
  })

  it("never sends a status — the DB default (agendada) applies", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { insert } = mockSessionClient({ data: { id: "meeting-1" }, error: null })

    await createLeadMeeting(
      undefined,
      qualificationFormData({ lead_id: validLeadId, scheduled_at: "2026-10-01T14:00:00Z" })
    )

    expect(insert.mock.calls[0][0]).not.toHaveProperty("status")
  })

  it("returns a field-level error for a malformed scheduled_at", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await createLeadMeeting(
      undefined,
      qualificationFormData({ lead_id: validLeadId, scheduled_at: "not-a-date" })
    )

    expect(result?.status).toBe("error")
    expect(createClient).not.toHaveBeenCalled()
  })

  it("returns a generic error when the insert fails", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockSessionClient({ data: null, error: { message: "RLS denied" } })

    const result = await createLeadMeeting(
      undefined,
      qualificationFormData({ lead_id: validLeadId, scheduled_at: "2026-10-01T14:00:00Z" })
    )

    expect(result).toEqual({ status: "error", error: "Não foi possível agendar a reunião. Tente novamente." })
  })
})

const meetingId = "44444444-4444-4444-8444-444444444444"

describe("updateLeadMeetingStatus", () => {
  beforeEach(() => {
    vi.mocked(getCurrentAdmin).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it("returns an error and does not touch the DB when unauthenticated", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue(null)

    const result = await updateLeadMeetingStatus(
      undefined,
      qualificationFormData({ meeting_id: meetingId, status: "realizada", expected_status: "agendada" })
    )

    expect(result).toEqual({ status: "error", error: expect.any(String) })
    expect(createClient).not.toHaveBeenCalled()
  })

  it("rejects agendada as a target status", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })

    const result = await updateLeadMeetingStatus(
      undefined,
      qualificationFormData({ meeting_id: meetingId, status: "agendada", expected_status: "agendada" })
    )

    expect(result?.status).toBe("error")
    expect(createClient).not.toHaveBeenCalled()
  })

  it("marks the meeting realizada when expected_status matches the DB", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    const { update, updateEqId, updateEqStatus } = mockConditionalUpdateClient({
      updateResult: { data: { id: meetingId }, error: null },
    })

    const result = await updateLeadMeetingStatus(
      undefined,
      qualificationFormData({ meeting_id: meetingId, status: "realizada", expected_status: "agendada" })
    )

    expect(result).toEqual({ status: "success" })
    expect(update).toHaveBeenCalledWith({ status: "realizada" })
    expect(updateEqId).toHaveBeenCalledWith("id", meetingId)
    expect(updateEqStatus).toHaveBeenCalledWith("status", "agendada")
  })

  it("marks the meeting cancelada when expected_status matches the DB", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockConditionalUpdateClient({ updateResult: { data: { id: meetingId }, error: null } })

    const result = await updateLeadMeetingStatus(
      undefined,
      qualificationFormData({ meeting_id: meetingId, status: "cancelada", expected_status: "agendada" })
    )

    expect(result).toEqual({ status: "success" })
  })

  it("reports a conflict when another admin already changed the meeting's status", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockConditionalUpdateClient({
      updateResult: { data: null, error: NO_ROWS_ERROR },
      selectResult: { data: { status: "cancelada" }, error: null },
    })

    const result = await updateLeadMeetingStatus(
      undefined,
      qualificationFormData({ meeting_id: meetingId, status: "realizada", expected_status: "agendada" })
    )

    expect(result).toEqual({ status: "conflict", currentStatus: "cancelada" })
  })

  it("returns a generic error when the meeting doesn't exist", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockConditionalUpdateClient({
      updateResult: { data: null, error: NO_ROWS_ERROR },
      selectResult: { data: null, error: null },
    })

    const result = await updateLeadMeetingStatus(
      undefined,
      qualificationFormData({ meeting_id: meetingId, status: "realizada", expected_status: "agendada" })
    )

    expect(result).toEqual({ status: "error", error: "Não foi possível atualizar a reunião. Tente novamente." })
  })

  it("returns a generic error on a real DB failure during the update", async () => {
    vi.mocked(getCurrentAdmin).mockResolvedValue({ id: "admin-1", role: "employer", name: "A" })
    mockConditionalUpdateClient({
      updateResult: { data: null, error: { code: "42501", message: "RLS denied" } },
    })

    const result = await updateLeadMeetingStatus(
      undefined,
      qualificationFormData({ meeting_id: meetingId, status: "realizada", expected_status: "agendada" })
    )

    expect(result).toEqual({ status: "error", error: "Não foi possível atualizar a reunião. Tente novamente." })
  })
})
