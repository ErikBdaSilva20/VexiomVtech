"use client"

import { useEffect, useRef } from "react"

import { LeadListItem } from "@/components/leads/lead-list-item"
import type { LeadDrilldownSlice, LeadDrilldownState } from "@/components/leads/use-lead-drilldown"

/** Exported for testing — see `truncationNote`. */
export const DRILLDOWN_RENDER_CAP = 100

/** Pure — the truncation note shown when a slice exceeds the render cap, or null otherwise. Exported for testing. */
export function truncationNote(total: number): string | null {
  if (total <= DRILLDOWN_RENDER_CAP) return null
  return "Mostrando os primeiros " + DRILLDOWN_RENDER_CAP + " de " + total + " — refine pela lista de leads."
}

/** Pure — the panel's title for a given slice. Exported for testing. */
export function drilldownTitle(slice: LeadDrilldownSlice): string {
  if (slice.kind === "status") return slice.label
  if (slice.kind === "project_type") return slice.label
  if (slice.kind === "leads") return slice.label
  return "Leads de " + slice.label
}

/** Pure — the empty-state copy for a given slice. Exported for testing. */
export function drilldownEmptyMessage(slice: LeadDrilldownSlice): string {
  return "Nenhum lead encontrado para \"" + slice.label + "\" no momento."
}

/**
 * Reusable drill-down panel for the leads overview (Funil/Tipos/Volume
 * mensal). Plain React/HTML modal — no UI library dependency, per the
 * spec's constraints. Renders once at the `LeadOverview` level and reacts
 * to `useLeadDrilldown`'s state.
 */
export function LeadDrilldownPanel({
  state,
  close,
  adminId,
}: {
  state: LeadDrilldownState
  close: () => void
  adminId: string
}) {
  const isOpen = state.status !== "closed"
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isOpen) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") close()
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isOpen, close])

  // Focus management: move focus into the dialog on open, restore it to the
  // element that triggered it (e.g. the row button) on close.
  useEffect(() => {
    if (!isOpen) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    closeButtonRef.current?.focus()

    return () => {
      previouslyFocusedRef.current?.focus()
    }
  }, [isOpen])

  // Lock body scroll while the panel is open so the page behind the overlay
  // doesn't keep scrolling.
  useEffect(() => {
    if (!isOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])

  if (state.status === "closed") return null

  const title = drilldownTitle(state.slice)

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={close}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="lead-drilldown-title"
        onClick={(event) => event.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#30362e] bg-[#171a17]"
      >
        <header className="flex items-center justify-between gap-4 border-b border-[#2c312b] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#fbd020]">Detalhe da seleção</p>
            <h2 id="lead-drilldown-title" className="mt-1 truncate text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Fechar detalhe"
            className="inline-flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg border border-[#4a5147] text-[#e0e5dd] hover:border-[#fbd020] hover:text-[#fbd020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div className="overflow-y-auto p-5 sm:p-6">
          {state.status === "loading" && (
            <p role="status" className="rounded-lg border border-dashed border-[#3d443b] px-4 py-10 text-center text-sm text-[#a9b0a6]">
              Carregando leads…
            </p>
          )}

          {state.status === "error" && (
            <div role="alert" className="rounded-2xl border border-red-900/70 bg-red-950/30 p-5 text-sm text-red-100">
              {state.message}
            </div>
          )}

          {state.status === "success" && state.result.leads.length === 0 && (
            <p className="rounded-lg border border-dashed border-[#3d443b] px-4 py-10 text-center text-sm text-[#a9b0a6]">
              {drilldownEmptyMessage(state.slice)}
            </p>
          )}

          {state.status === "success" && state.result.leads.length > 0 && (
            <>
              {truncationNote(state.result.leads.length) && (
                <p role="status" className="mb-4 rounded-lg border border-[#4d412c] bg-[#211d14] px-4 py-3 text-sm text-[#e0cfa8]">
                  {truncationNote(state.result.leads.length)}
                </p>
              )}
              <ul className="list-none divide-y divide-[#30362e] overflow-hidden rounded-2xl border border-[#343a32] bg-[#171a17] p-0">
                {state.result.leads.slice(0, DRILLDOWN_RENDER_CAP).map((lead) => (
                  <li key={lead.id} className="transition-colors hover:bg-[#1c201c]">
                    <LeadListItem lead={lead} adminId={adminId} />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
