---
title: 'Story 3.1: Indicadores gerais da prospecção (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
baseline_commit: '408df3a'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/painel-8f2k/leads` needs a top-of-page overview: funnel by status, conversion rate, project-type distribution, and volume-by-month — all recalculating for an admin-selected period. Nothing currently aggregates `leads` data.

**Approach:** `getProspectingOverview(supabase, query)` — a single read of `status`/`project_type`/`created_at` for the period, aggregated in memory. No new SQL/RPC: data volume for a single-company CRM doesn't justify a DB-side aggregation function, and the project has no existing precedent for one. Default period (when `from`/`to` are omitted) is the trailing 12 months ending today, giving the volume-by-month chart a sensible out-of-the-box range.

## Boundaries & Constraints

**Always:**
- `from`/`to` are independently optional; provided bounds are honored as-is (inclusive).
- Funnel always reports all 10 `LEAD_STATUSES` keys (zero-filled), so the UI never has to guess a missing status means zero.
- `conversionRate` is `contrato_fechado count / total leads in period`, `0` when the period has no leads (never `NaN`/divide-by-zero).
- `volumeByMonth` is sorted ascending by month (`YYYY-MM`).

**Never:**
- No new SQL migration — reuses the existing `leads_select_admins` RLS policy and existing columns.
- No page/component in this story — backend only, matching the Epic 2 precedent of shipping DAL/schema first.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No period given | — | Defaults to trailing 12 months ending today | N/A |
| Explicit `from`/`to` | Valid range | Only leads with `created_at` in range are aggregated | N/A |
| `from` > `to` | — | Schema rejects with field-level error | N/A |
| Malformed date | — | Schema rejects (`invalid_format`) | N/A |
| No leads in period | — | `totalLeads: 0`, `conversionRate: 0`, empty `volumeByMonth`, zero-filled funnel | N/A |
| Query fails | DB/RLS error | Generic error surfaced | Logged server-side |

</frozen-after-approval>

## Code Map

- `src/lib/leads/lead-status.ts` -- added `TERMINAL_LEAD_STATUSES`/`isTerminalLeadStatus` (needed again by 3.2; added now since it's a natural extension of the existing `LEAD_STATUSES` single-source-of-truth file, not scope creep for 3.1 itself).
- `src/lib/leads/list-leads.ts` -- read-DAL convention (throw + log on error, session-aware client) `getProspectingOverview` follows.
- `src/lib/leads/list-leads-schema.ts` -- query-schema convention (`z.object` + `.transform`) `prospectingOverviewQuerySchema` follows.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/leads/prospecting-overview-schema.ts` -- new `prospectingOverviewQuerySchema`
- [x] `src/lib/leads/get-prospecting-overview.ts` -- new `getProspectingOverview(supabase, query)`
- [x] `src/lib/leads/lead-status.ts` -- add `TERMINAL_LEAD_STATUSES`/`isTerminalLeadStatus` (used by 3.1's funnel exclusion reasoning and by 3.2's risk-alert exclusion)
- [x] Tests for all new/changed modules

**Acceptance Criteria:** see I/O matrix above (mirrors FR21 ACs verbatim).

## Implementation Notes

- Implemented directly, self-reviewed inline (no subagent dispatch), per standing token-conservation instruction.
- Aggregation is in-memory over a single filtered `select` — simplest correct approach; revisit only if lead volume ever makes this a real performance concern (no evidence of that today).
- `z.iso.date({ error: "..." })` confirmed via a throwaway script (same category check as prior `z.uuid()`/`z.iso.datetime()` findings — this project's zod version takes the message via the options object, not a second positional argument).
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (174 tests) all pass.
- Not verified against a live Supabase instance — no CLI/DB access in this environment.

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 174 tests pass, including new coverage for `prospecting-overview-schema.ts` and `get-prospecting-overview.ts`
