---
title: 'Reusable drill-down for /leads overview sections'
type: 'feature'
created: '2026-09-25'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '050270b262ca0c8946ae96c0a6a20052673bc6bd'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** In `/painel-8f2k/leads`, the "Funil por etapa", "Tipos de projeto" and "Leads recebidos por mês" panels (`LeadOverview` in `src/components/leads/lead-dashboard.tsx`) only show aggregate counts. Clicking a row gives no way to see which leads make up that number.

**Approach:** Make each row in those three panels clickable, opening a reusable detail view (shared hook + component) that lists the individual leads for that slice (status, project type, or month), reusing the existing `listLeads`/`LeadListSection` data path.

## Boundaries & Constraints

**Always:** Reuse `listLeads` (`src/lib/leads/list-leads.ts`) as the data source for the drill-down — no new query/aggregation logic duplicated. Keep the drill-down abstraction (hook + component) generic over the three slice kinds (status / project_type / month), not three separate implementations. Preserve the existing `LeadOverview`/`CountPanel` rendering for non-interactive consumers (e.g. if reused elsewhere without drill-down).

**Never:** Do not touch the admin dashboard (`/painel-8f2k`) charts or the "Visão geral" page — this story is scoped to `/painel-8f2k/leads` only. Do not introduce a UI library dependency (no Radix/Headless UI) — the project has none; build the modal with plain React/HTML.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Click a status row | User clicks "Follow-up pendente" (12) | Drill-down opens, calls `listLeads({ status: 'follow_up_pendente' })`, shows matching leads | N/A |
| Click a project-type row | User clicks "Aplicativo" (7) | Drill-down opens filtered by `project_type` | N/A |
| Click a month row | User clicks "03/26" (20) | Drill-down opens filtered by that month's date range | N/A |
| Slice has zero leads | Row count is 0 at click time (stale render) | Drill-down opens showing an empty state, not an error | N/A |
| listLeads fails | Supabase error during drill-down fetch | Drill-down shows an inline error message, page underneath stays intact | Catch and render `ErrorState`-equivalent, log server-side |
| Close drill-down | User presses Escape or clicks outside/close button | Drill-down closes, underlying page state unchanged | N/A |

</frozen-after-approval>

## Code Map

- `src/components/leads/lead-dashboard.tsx` -- `LeadOverview`/`CountPanel` render the 3 panels; rows here become clickable triggers for the drill-down.
- `src/lib/leads/list-leads.ts` + `src/lib/leads/list-leads-schema.ts` -- `listLeads(supabase, filters)` already supports `status`/`project_type`; needs `from`/`to` (date range) added for the month slice, mirroring `prospecting-overview-schema.ts`'s date handling (`sao-paulo-time.ts` helpers).
- `src/components/leads/lead-list-section.tsx` -- existing lead list rendering (cards, pagination) for the "list" section; the drill-down's list body should reuse/extract its item-rendering rather than duplicate it.
- `src/app/painel-8f2k/leads/page.tsx` -- server component owning `listLeads` calls today; drill-down data fetch happens client-side (new API route or server action) since it's triggered post-render from `LeadOverview`.
- No existing modal/dialog component in the project (`src/components/ui/` does not exist) — the new drill-down component is the first of its kind.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/leads/list-leads-schema.ts` -- add optional `from`/`to` date-range fields to `listLeadsQuerySchema` -- enables month-slice filtering
- [x] `src/lib/leads/list-leads.ts` -- apply `from`/`to` as a `created_at` range filter when present -- reuses existing query builder, no new function
- [x] `src/app/painel-8f2k/leads/drill-down-leads/route.ts` (new) -- GET route returning `listLeads` results for a given slice (status/project_type/from+to) as JSON, admin-guarded via `getCurrentAdmin` -- backs the client-side fetch
- [x] `src/components/leads/use-lead-drilldown.ts` (new) -- reusable hook: `{ open(slice), close(), isOpen, slice, data, loading, error }`, fetches from the new route on `open` -- single source of truth for drill-down state
- [x] `src/components/leads/lead-drilldown-panel.tsx` (new) -- reusable modal/panel component: title derived from slice, renders lead list (reusing `LeadListSection`'s item markup or an extracted sub-component), close button + Escape handling, loading/empty/error states
- [x] `src/components/leads/lead-dashboard.tsx` -- wire `CountPanel` rows to `useLeadDrilldown().open(...)`, render `<LeadDrilldownPanel />` once at the `LeadOverview` level
- [x] `src/components/leads/lead-drilldown-panel.test.ts` (new) -- unit-test open/close, loading/error/empty rendering
- [x] `src/lib/leads/list-leads.test.ts` -- extend with cases for `from`/`to` filtering

**Acceptance Criteria:**
- Given the leads overview is rendered, when a user clicks any row in Funil/Tipos/Volume mensal, then the drill-down opens showing only leads matching that slice.
- Given the drill-down is open, when the user presses Escape or clicks the close control, then it closes without navigating away from `/painel-8f2k/leads`.
- Given `listLeads` fails for the slice, when the drill-down is open, then an inline error is shown instead of a crash.

## Implementation Notes

- Extracted `LeadListItem` (`src/components/leads/lead-list-item.tsx`) out of `lead-list-section.tsx` so the drill-down panel reuses the exact same lead-card markup instead of duplicating it — not called out as a separate task in the original spec, but implied by "reusing `LeadListSection`'s item markup or an extracted sub-component."
- `lead-dashboard.tsx` became a client component (`"use client"`) since `CountPanel` rows now need `onClick` handlers.
- `vitest.config.ts` has no jsdom/testing-library set up (node environment only, `*.test.ts` glob), so `lead-drilldown-panel.test.ts` covers the panel's pure logic (title/empty-state derivation, slice→params mapping, state-machine shape) rather than DOM rendering/Escape-key behavior — flagged as a manual-check item below.
- `drill-down-leads` route defaults `page_size` to 100 (no pagination UI in the panel) — if a single slice exceeds 100 leads, results are silently truncated. Not in the original I/O matrix; worth a follow-up if real data volume hits this.

## Review Triage Log

- **medium** — `src/components/leads/use-lead-drilldown.ts:48-63` — `open()` has no request-ordering guard: quick successive clicks race, and a stale response (including one arriving after `close()`) can overwrite newer/closed state, showing the wrong slice or silently reopening the panel. Verified: no request id / abort check exists in `open`. Route: patch.
- **false** — `src/components/leads/lead-dashboard.tsx:35-39` (`monthDateRange`) — claimed UTC/local-timezone inconsistency vs. `startOfLocalDay`. Refuted: `monthDateRange` only derives plain calendar `YYYY-MM-DD` boundaries via UTC arithmetic (timezone-neutral extraction of year/month + last-day-of-month), it never claims to produce a TZ-aware instant; the actual TZ conversion happens downstream in `list-leads.ts` via `startOfLocalDay`, which is correctly used. No incorrect date range results.
- **medium** — verification-gap — `monthDateRange` (`lead-dashboard.tsx:35-39`) has no unit test despite its own comment "Exported for testing," and drives the month-slice drill-down's date range with no regression coverage. Pre-verified by the reviewer (grep confirmed no test file references it). Route: patch.
- **low** — `src/app/painel-8f2k/leads/drill-down-leads/route.ts:404-417` — `page_size` hardcoded to 100, no pagination; a slice with >100 leads is silently truncated with no indicator. Verified: route never reads a `page` param. Rejected as low: unlikely to be hit at current data volume, and a proper fix (pagination UI or truncation banner) is more than a trivial correction. Already noted in Implementation Notes as a follow-up.
- **medium** — `src/components/leads/lead-drilldown-panel.tsx` — modal has `role="dialog"`/`aria-modal` but no focus management: doesn't move focus in on open, doesn't restore focus to the trigger on close. Verified: no focus-related code in the component. Real keyboard/screen-reader accessibility gap for a first-of-its-kind modal. Route: patch (focus-on-open + focus-restore; full Tab-trap cycling is a larger addition, accepted as residual low risk given no modal library in this project).
- **low** — `src/components/leads/lead-drilldown-panel.tsx` — no body-scroll lock while open, page behind the overlay keeps scrolling. Verified: no `overflow` toggling on `<body>`/root. Fix is trivial (toggle on open/close). Route: patch.
- **low** — `src/lib/leads/list-leads-schema.ts:28-29` / `src/app/painel-8f2k/leads/drill-down-leads/route.ts` — no cross-field validation that `from <= to`; an inverted range is accepted and silently returns zero rows. Verified: schema validates each date independently. Not reachable from the current UI, but the route is a real endpoint. Fix is trivial (one `.refine()`/comparison). Route: patch.
- **false** — `src/app/painel-8f2k/leads/drill-down-leads/route.ts:410-417` (edge-case hunter) — claimed a non-`YYYY-MM` month string reaching `monthDateRange` could throw a `RangeError` and crash `LeadOverview`. Refuted: `overview.volumeByMonth` is exclusively produced server-side by `get-prospecting-overview.ts` via `localMonthString`, which always returns `YYYY-MM`; there is no code path feeding an arbitrary/malformed month string into `monthDateRange`.
- **false** — `src/components/leads/lead-dashboard.tsx` (blind hunter) — claimed converting to `"use client"` risks shipping sensitive/unneeded fields in `overview` to the client bundle. Refuted: `ProspectingOverview` (`get-prospecting-overview.ts`) is exclusively aggregate counts (funnel/project-type/volume-by-month numbers) with no lead PII; this data was already rendered into the page's HTML/client-visible output before this change.
- **defer** — verification-gap ("Other findings") — `useLeadDrilldown`'s `open()` → fetch → state-transition flow (loading/success/error) has no DOM-level test, because the project's `vitest.config.ts` runs in a `node` environment with no jsdom/testing-library set up anywhere in the repo. Pre-existing project-wide testing constraint, not introduced by this story.

## Design Notes

Client-side fetch (new route handler) was chosen over a server action or full-page `?section=list&status=X` reuse because: the request explicitly asks for a distinct, reusable hook + component pattern that opens "uma tela especial" on click — a URL-driven full section swap does not give the modal/detail-view feel requested, and a route handler keeps the hook framework-agnostic (fetch-based) and easy to reuse for future slices beyond these three panels.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no type errors
- `npx eslint src/components/leads src/lib/leads src/app/painel-8f2k/leads` -- expected: no errors/warnings
- `npx vitest run` -- expected: all tests pass, including new drill-down tests

**Manual checks (if no CLI):**
- In the browser, open `/painel-8f2k/leads`, click a row in each of the 3 panels, confirm the drill-down shows the right filtered leads and closes cleanly.
