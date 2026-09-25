---
title: 'Unify /leads into a single scrollable page'
type: 'feature'
created: '2026-09-25'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '4eacd3bbf9fda35cba7cbecddf0863cb0506682d'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/painel-8f2k/leads` splits Visão geral, Alertas e agenda, and Lista de leads into 3 mutually-exclusive views behind a `<select>` that swaps the URL. Only one section is fetched/rendered at a time, so the most time-sensitive one (Alertas — SLA estourado, follow-ups vencidos) is easy to forget to check. At real data volume its raw card lists (dozens of unpaginated cards per risk category) are also overwhelming when visited.

**Approach:** Remove the section selector. Render Alertas (as clickable count cards, not raw lists) → Visão geral → Lista de leads as stacked sections on one continuous page, always fetched together.

## Boundaries & Constraints

**Always:** Reuse `LeadDrilldownPanel`/`useLeadDrilldown` for the risk-category cards (SLA estourado, Sem próxima ação, Follow-ups vencidos, Leads esfriando) instead of building a new list UI. Keep the agenda (today's follow-ups + meetings) as its own compact list — it merges two data sources and already links per-lead, so it is not a `listLeads`-filterable slice. Keep `LeadOverview` and `LeadListSection` behavior unchanged beyond removing the selector wrapper.

**Never:** Do not add new `listLeads` filters to replicate the 4 risk categories' derived logic (SLA business-hours math, "no next action", etc.) — that logic already lives once in `getLeadRiskAlerts` and must not be duplicated. Do not paginate/lazy-load the page's 3 sections separately (single request per data source, all in parallel).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Page loads normally | Admin visits `/painel-8f2k/leads` | Alertas, Visão geral, Lista all render on one page, no section param needed | N/A |
| Click a risk-category card | Click "SLA estourado" (48) | Drill-down opens showing those 48 leads directly, no re-fetch | N/A |
| Risk category empty | e.g. `coolingLeads.length === 0` | Card shows 0, not rendered as clickable (or opens to an empty state) | N/A |
| One data source fails | `getLeadRiskAlerts` throws | That section shows an inline error; Visão geral and Lista still render normally | Catch per source, independent `ErrorState` |
| Old `?section=...` URL visited (bookmark/link) | `?section=list&status=X` | Page ignores `section`, still applies List's own filters (`status`, etc.) from the query string — just no longer gates which section renders | N/A |

</frozen-after-approval>

## Code Map

- `src/app/painel-8f2k/leads/page.tsx` -- currently gates data-fetching (`getProspectingOverview`/`getLeadRiskAlerts`+`getDailyAgendaAlerts`/`listLeads`) by `section`; must fetch all three in parallel (each independently try/caught, mirroring `/painel-8f2k` dashboard's per-section isolation) and drop `LeadSectionSelector`/`parseSection`/`buildSectionHrefs`.
- `src/components/leads/lead-section-selector.tsx` -- delete; no longer used anywhere.
- `src/components/leads/lead-dashboard.tsx` -- `LeadAlerts` (line ~251) currently renders `riskGroups` as raw unpaginated card lists; rewrite to 4 clickable count cards wired to a new `useLeadDrilldown().openWithLeads`, keep the `appointments` (agenda) merge logic but tighten the layout — no data-fetching change needed there.
- `src/lib/leads/get-lead-risk-alerts.ts` -- `RiskAlertRow` (line ~14) only selects `id, name, company, status, created_at, viewed_at, next_action, next_action_at, last_interaction_at`; widen the `select(...)` and return type to the full `leads` row (`Database["public"]["Tables"]["leads"]["Row"]`) so `LeadListItem` can render risk-category leads without a new/duplicate item component.
- `src/components/leads/use-lead-drilldown.ts` -- `LeadDrilldownSlice`/`LeadDrilldownState`/`open()` today only support fetch-based slices (status/project_type/month) via the `/drill-down-leads` route. Add `openWithLeads(label, leads)`: sets state directly to a `success` status with the given leads (no HTTP call) — the 4 risk categories are already loaded in full on `page.tsx`, so re-fetching them would duplicate the derived-logic query this spec explicitly avoids adding.
- `src/components/leads/lead-drilldown-panel.tsx` -- renders `state.result.leads` with no cap; add a render cap (100) with a "mostrando os primeiros 100 de N — refine pela lista de leads" note when exceeded, since risk categories (unlike the fetch-based slices, which are already page-sized) can be arbitrarily large.
- `src/components/leads/lead-list-item.tsx` -- unchanged; reused as-is once risk rows carry full lead fields.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/leads/get-lead-risk-alerts.ts` -- widen `RiskAlertRow`/`select()` to the full `leads` row -- lets risk drilldowns reuse `LeadListItem`
- [x] `src/lib/leads/get-lead-risk-alerts.test.ts` -- adjust/extend fixtures for the wider row shape
- [x] `src/components/leads/use-lead-drilldown.ts` -- add `openWithLeads(label, leads)`, extending `LeadDrilldownState`'s success path to accept pre-loaded leads without fetching
- [x] `src/components/leads/lead-drilldown-panel.tsx` -- add the 100-item render cap with a truncation note
- [x] `src/components/leads/lead-dashboard.tsx` -- rewrite `LeadAlerts` to 4 clickable risk-count cards (wired to `openWithLeads`) + a compact agenda list; render `<LeadDrilldownPanel>` for the alerts section (reuse the one already rendered in `LeadOverview`, or hoist one shared instance if both sections are now always mounted together)
- [x] `src/app/painel-8f2k/leads/page.tsx` -- remove section gating, fetch overview/risk+agenda/list in parallel with independent error handling, render all 3 sections stacked; drop `LeadSectionSelector` import/usage
- [x] `src/components/leads/lead-section-selector.tsx` -- delete file
- [x] `src/components/leads/lead-dashboard.test.ts` -- extend for the new `LeadAlerts` card/count rendering logic and `openWithLeads` wiring
- [x] `src/components/leads/lead-drilldown-panel.test.ts` -- extend for the render-cap behavior

**Acceptance Criteria:**
- Given an admin opens `/painel-8f2k/leads`, when the page loads, then Alertas, Visão geral, and Lista de leads all render without needing to select a section.
- Given a risk-category card shows a count > 0, when clicked, then the drill-down opens immediately with those leads (no network request).
- Given one of the three data sources fails, when the page renders, then only that section shows an error state — the other two still work.

## Implementation Notes

- Formal 3-layer subagent review (Blind Hunter / Edge Case Hunter / Verification Gap) was started then stopped by the user to conserve subagent token budget ahead of a Tuesday reset. In its place: the full diff was read and traced task-by-task against the spec's Code Map/Tasks by the coordinating session directly, `tsc`/`eslint`/`vitest` all passed clean (62 files, 473 tests), and the page was manually exercised in Chromium — confirmed no selector remains, all 3 sections render stacked, and clicking "SLA estourado" opens the drill-down instantly with the right leads (no network request).

## Design Notes

`openWithLeads` (pre-loaded, no fetch) was chosen over adding 4 new `listLeads` filters to reproduce each risk category, because that derived logic (business-hours SLA math, "no next action", etc.) already exists once in `getLeadRiskAlerts` — duplicating it into `listLeads` would create two sources of truth for the same rule. Since risk data is already loaded in full on every page load (no pagination today), reusing it in-memory for the drill-down is strictly cheaper and can't drift from what's shown in the count card.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no type errors
- `npx eslint src/components/leads src/lib/leads src/app/painel-8f2k/leads` -- expected: no errors/warnings
- `npx vitest run` -- expected: all tests pass

**Manual checks (if no CLI):**
- In the browser, open `/painel-8f2k/leads`: confirm no section selector remains, all 3 sections are visible by scrolling, and clicking a risk-category card (e.g. SLA estourado) opens the drill-down instantly with the right leads.
