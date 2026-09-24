---
title: 'Story 3.2: Alertas de risco na prospecção (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '7f107ed'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** FR22-25 require four risk lists on the leads panel: SLA de primeiro contato estourado (12h úteis sem `viewed_at`), sem próxima ação, follow-up vencido, e lead esfriando (sem interação há 5+ dias). Nothing computes these today, and "horas úteis" has no existing definition in code or docs.

**Decision (confirmed with the user):** business hours = Mon-Fri, 09:00-18:00, America/Sao_Paulo. Brazil has used a fixed UTC-3 offset with no DST since 2019, so `business-hours.ts` uses a constant offset rather than timezone-database lookups.

**Approach:** `getLeadRiskAlerts(supabase, now)` — one read of the relevant columns for all leads, categorized in memory into the four lists. Terminal-status leads (`TERMINAL_LEAD_STATUSES`, added in 3.1) are excluded from every list unconditionally. `businessHoursElapsed(from, to)` is a standalone pure utility (`src/lib/leads/business-hours.ts`), unit-tested independently of the DAL.

## Boundaries & Constraints

**Always:**
- A lead in a terminal status (`contrato_fechado`, `nao_convertido`, `em_suporte_continuo`) never appears in any of the four lists, regardless of how its other fields look.
- SLA breach requires both: `viewed_at IS NULL` AND more than 12 business hours elapsed since `created_at`.
- Cooling requires: `last_interaction_at IS NULL` OR more than 5 calendar days old (calendar days, not business days — FR24 says "5 dias", not "5 dias úteis").
- Overdue follow-up requires: `next_action_at` in the past (any non-terminal status).
- A lead can appear in more than one list simultaneously (e.g. no next action AND cooling) — the lists are independent characterizations, not mutually exclusive buckets.

**Never:**
- No new SQL/migration — reuses `leads_select_admins` RLS and existing columns.
- No page/component in this story — backend only.
- `businessHoursElapsed` never used for the cooling/overdue calculations — those are explicitly calendar-day/instant comparisons per the AC wording.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lead unviewed, created >12 business hours ago | Non-terminal | In `slaBreached` | N/A |
| Lead already viewed | — | Never in `slaBreached`, regardless of age | N/A |
| Non-terminal lead, `next_action` null | — | In `noNextAction` | N/A |
| Non-terminal lead, `next_action_at` in the past | — | In `overdueFollowUps` | N/A |
| Non-terminal lead, `next_action_at` in the future | — | Not in `overdueFollowUps` | N/A |
| Non-terminal lead, no interaction ever or >5 days old | — | In `coolingLeads` | N/A |
| Lead in a terminal status | Matches every other condition | Absent from all four lists | N/A |
| Query fails | DB/RLS error | Generic error surfaced | Logged server-side |

</frozen-after-approval>

## Code Map

- `src/lib/leads/lead-status.ts` -- `TERMINAL_LEAD_STATUSES`/`isTerminalLeadStatus` (added in 3.1) reused for exclusion.
- `src/lib/leads/get-prospecting-overview.ts` -- "read once, aggregate in memory" convention `getLeadRiskAlerts` follows.
- `src/app/painel-8f2k/leads/[id]/page.tsx` -- existing `Intl.DateTimeFormat(..., { timeZone: "America/Sao_Paulo" })` precedent confirming the project's business timezone.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/leads/business-hours.ts` -- new `businessHoursElapsed(from, to)`
- [x] `src/lib/leads/get-lead-risk-alerts.ts` -- new `getLeadRiskAlerts(supabase, now?)`
- [x] Tests for both new modules

**Acceptance Criteria:** see I/O matrix above (mirrors FR22-25 ACs verbatim).

## Implementation Notes

- Implemented directly, self-reviewed inline (no subagent dispatch), per standing token-conservation instruction.
- Business-hours definition (Mon-Fri 09:00-18:00, America/Sao_Paulo) was a genuine business-requirement gap — confirmed with the user via AskUserQuestion before implementing, per the "stop and ask on real uncertainty" principle, rather than guessing.
- `now` is an optional parameter (defaults to `new Date()`) purely for testability — not user input, so no zod schema for it.
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (188 tests) all pass.
- Not verified against a live Supabase instance — no CLI/DB access in this environment.

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 188 tests pass, including new coverage for `business-hours.ts` and `get-lead-risk-alerts.ts`
