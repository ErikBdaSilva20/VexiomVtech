"use client"

import { useCallback, useRef, useState } from "react"

import type { ListLeadsResult } from "@/lib/leads/list-leads"

/**
 * A slice of the leads overview a user can drill into — one variant per
 * clickable panel in `LeadOverview` (Funil por etapa / Tipos de projeto /
 * Leads recebidos por mês). Generic over the three kinds rather than three
 * separate hooks, per the spec's "reusable abstraction" constraint.
 */
export type LeadDrilldownSlice =
  | { kind: "status"; value: string; label: string }
  | { kind: "project_type"; value: string; label: string }
  | { kind: "month"; from: string; to: string; label: string }

export type LeadDrilldownState =
  | { status: "closed" }
  | { status: "loading"; slice: LeadDrilldownSlice }
  | { status: "success"; slice: LeadDrilldownSlice; result: ListLeadsResult }
  | { status: "error"; slice: LeadDrilldownSlice; message: string }

const DRILLDOWN_ROUTE = "/painel-8f2k/leads/drill-down-leads"
const GENERIC_ERROR_MESSAGE = "Não foi possível carregar os leads desta seleção."

/** Pure — maps a slice to the query params the drill-down route expects. Exported for testing. */
export function drilldownSliceToParams(slice: LeadDrilldownSlice): URLSearchParams {
  const params = new URLSearchParams()
  if (slice.kind === "status") params.set("status", slice.value)
  if (slice.kind === "project_type") params.set("project_type", slice.value)
  if (slice.kind === "month") {
    params.set("from", slice.from)
    params.set("to", slice.to)
  }
  return params
}

/**
 * Single source of truth for drill-down state (open/close/fetch), shared by
 * all three clickable panels. Fetches from the new route handler on
 * `open()` rather than a server action, so it stays framework-agnostic and
 * reusable for future slices.
 */
export function useLeadDrilldown() {
  const [state, setState] = useState<LeadDrilldownState>({ status: "closed" })
  // Guards against out-of-order responses: only the response matching the
  // latest issued request id is committed to state, so a stale fetch
  // (including one that resolves after close()) can't clobber newer state.
  const latestRequestId = useRef(0)

  const open = useCallback((slice: LeadDrilldownSlice) => {
    const requestId = ++latestRequestId.current
    setState({ status: "loading", slice })

    void (async () => {
      try {
        const params = drilldownSliceToParams(slice)
        const response = await fetch(DRILLDOWN_ROUTE + "?" + params.toString())
        if (!response.ok) throw new Error("request failed")
        const result = (await response.json()) as ListLeadsResult
        if (latestRequestId.current !== requestId) return
        setState({ status: "success", slice, result })
      } catch (error) {
        if (latestRequestId.current !== requestId) return
        console.error("useLeadDrilldown: failed to load slice", error)
        setState({ status: "error", slice, message: GENERIC_ERROR_MESSAGE })
      }
    })()
  }, [])

  const close = useCallback(() => {
    latestRequestId.current++
    setState({ status: "closed" })
  }, [])

  return { state, open, close }
}
