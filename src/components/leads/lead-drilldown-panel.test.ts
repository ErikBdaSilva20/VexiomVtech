import { describe, expect, it } from "vitest"

import { DRILLDOWN_RENDER_CAP, drilldownEmptyMessage, drilldownTitle, truncationNote } from "./lead-drilldown-panel"
import { buildLeadsSuccessState, drilldownSliceToParams, type LeadDrilldownSlice, type LeadDrilldownState } from "./use-lead-drilldown"
import type { Database } from "@/lib/supabase/database.types"

type LeadRow = Database["public"]["Tables"]["leads"]["Row"]

// This project's vitest config only picks up `*.test.ts` (node environment,
// no jsdom/testing-library) — see `vitest.config.ts`. The panel's
// open/close and loading/error/empty behavior is therefore exercised
// through the pure functions that drive it (title/empty-state derivation,
// slice → query-params mapping, and the state machine's shape) rather than
// through DOM rendering.

const statusSlice: LeadDrilldownSlice = { kind: "status", value: "follow_up_pendente", label: "Follow-up pendente" }
const projectTypeSlice: LeadDrilldownSlice = { kind: "project_type", value: "Aplicativo", label: "Aplicativo" }
const monthSlice: LeadDrilldownSlice = { kind: "month", from: "2026-03-01", to: "2026-03-31", label: "março de 2026" }
const leadsSlice: LeadDrilldownSlice = { kind: "leads", label: "SLA estourado" }

describe("drilldownTitle", () => {
  it("uses the label directly for a status slice", () => {
    expect(drilldownTitle(statusSlice)).toBe("Follow-up pendente")
  })

  it("uses the label directly for a project_type slice", () => {
    expect(drilldownTitle(projectTypeSlice)).toBe("Aplicativo")
  })

  it("prefixes the label for a month slice", () => {
    expect(drilldownTitle(monthSlice)).toBe("Leads de março de 2026")
  })

  it("uses the label directly for a pre-loaded leads slice (risk-category cards)", () => {
    expect(drilldownTitle(leadsSlice)).toBe("SLA estourado")
  })
})

describe("drilldownEmptyMessage", () => {
  it("names the slice in the empty-state copy", () => {
    expect(drilldownEmptyMessage(statusSlice)).toContain("Follow-up pendente")
    expect(drilldownEmptyMessage(monthSlice)).toContain("março de 2026")
  })
})

describe("drilldownSliceToParams", () => {
  it("maps a status slice to a status query param", () => {
    const params = drilldownSliceToParams(statusSlice)
    expect(params.get("status")).toBe("follow_up_pendente")
    expect(params.get("project_type")).toBeNull()
    expect(params.get("from")).toBeNull()
  })

  it("maps a project_type slice to a project_type query param", () => {
    const params = drilldownSliceToParams(projectTypeSlice)
    expect(params.get("project_type")).toBe("Aplicativo")
    expect(params.get("status")).toBeNull()
  })

  it("maps a month slice to from/to query params", () => {
    const params = drilldownSliceToParams(monthSlice)
    expect(params.get("from")).toBe("2026-03-01")
    expect(params.get("to")).toBe("2026-03-31")
    expect(params.get("status")).toBeNull()
  })
})

describe("truncationNote", () => {
  it("returns null when the count is at or under the render cap", () => {
    expect(truncationNote(0)).toBeNull()
    expect(truncationNote(DRILLDOWN_RENDER_CAP)).toBeNull()
  })

  it("names the cap and the total when the count exceeds the render cap", () => {
    expect(truncationNote(DRILLDOWN_RENDER_CAP + 37)).toBe(
      "Mostrando os primeiros " + DRILLDOWN_RENDER_CAP + " de " + (DRILLDOWN_RENDER_CAP + 37) + " — refine pela lista de leads."
    )
  })
})

describe("buildLeadsSuccessState (openWithLeads)", () => {
  it("commits a success state directly, with no fetch, for a pre-loaded set of leads", () => {
    const leads = [{ id: "l1" }, { id: "l2" }] as LeadRow[]
    const state = buildLeadsSuccessState("SLA estourado", leads)

    expect(state).toEqual({
      status: "success",
      slice: { kind: "leads", label: "SLA estourado" },
      result: { leads, total: 2, page: 1, pageSize: 2 },
    })
  })

  it("uses a pageSize of at least 1 even for an empty set", () => {
    const state = buildLeadsSuccessState("Sem próxima ação", [])
    expect(state).toEqual({
      status: "success",
      slice: { kind: "leads", label: "Sem próxima ação" },
      result: { leads: [], total: 0, page: 1, pageSize: 1 },
    })
  })
})

describe("LeadDrilldownState shape", () => {
  it("represents closed, loading, success (possibly empty) and error as distinct states", () => {
    const closed: LeadDrilldownState = { status: "closed" }
    const loading: LeadDrilldownState = { status: "loading", slice: statusSlice }
    const emptySuccess: LeadDrilldownState = {
      status: "success",
      slice: statusSlice,
      result: { leads: [], total: 0, page: 1, pageSize: 100 },
    }
    const error: LeadDrilldownState = {
      status: "error",
      slice: statusSlice,
      message: "Não foi possível carregar os leads desta seleção.",
    }

    expect(closed.status).toBe("closed")
    expect(loading.status).toBe("loading")
    expect(emptySuccess.status).toBe("success")
    expect(emptySuccess.status === "success" && emptySuccess.result.leads).toHaveLength(0)
    expect(error.status).toBe("error")
    expect(error.status === "error" && error.message).toBeTruthy()
  })
})
