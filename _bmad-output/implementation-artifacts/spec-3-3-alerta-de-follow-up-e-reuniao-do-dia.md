---
title: 'Story 3.3: Alerta de follow-up e reunião do dia (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: 'ea717a6'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** FR26 needs a same-day (or overdue) attention banner on `/painel-8f2k` and `/painel-8f2k/leads`: leads with `next_action_at` due today-or-earlier, and meetings (`lead_meetings.status = 'agendada'`) scheduled today-or-earlier. Cancelled meetings must never appear.

**Approach:** `getDailyAgendaAlerts(supabase, now)` — two independent read queries (follow-up leads, scheduled meetings), run in parallel via `Promise.all`, plus a small lead-name lookup for the meetings list. "Today" uses the same America/Sao_Paulo local-day boundary established in 3.2, extracted into a shared `sao-paulo-time.ts` (`startOfNextLocalDay`) so `business-hours.ts` and this module share one definition instead of duplicating the offset constant.

**Existing-pattern flag (Anti-Vibe-Coding Gate #2):** `database.types.ts` declares `Relationships: []` for every table, so a `.select("leads(name)")` embed on `lead_meetings` wouldn't be backed by typed relationship metadata (the file is hand-maintained, not generated from a live instance available in this environment). Decided to avoid the embed and do a plain second query by `lead_id` instead — consistent with every other DAL in this codebase, none of which use embeds.

## Boundaries & Constraints

**Always:**
- "Today or overdue" = `next_action_at` / `scheduled_at` strictly before the start of the next America/Sao_Paulo calendar day (i.e., includes anything from the past up through the end of today).
- Meetings are filtered to `status = 'agendada'` only — `realizada`/`cancelada` meetings never appear, regardless of date.
- Follow-up leads exclude terminal statuses (`TERMINAL_LEAD_STATUSES`), same exclusion as 3.2.

**Never:**
- No new SQL/migration.
- No `.select()` embed relying on undeclared FK relationship metadata — see flag above.
- No page/component in this story — backend only.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lead has `next_action_at` today or in the past, non-terminal | — | In `followUps` | N/A |
| Lead has `next_action_at` in the future | — | Not in `followUps` | N/A |
| Lead is terminal with an overdue `next_action_at` | — | Not in `followUps` | N/A |
| Meeting `agendada`, `scheduled_at` today or in the past | — | In `meetings`, with the lead's name | N/A |
| Meeting `cancelada`/`realizada` | Any date | Never in `meetings` | N/A |
| Nothing due | — | Both lists empty | N/A |
| Either query fails | DB/RLS error | Generic error surfaced | Logged server-side |

</frozen-after-approval>

## Code Map

- `src/lib/leads/sao-paulo-time.ts` -- new shared file: `SAO_PAULO_OFFSET_MS`/`MS_PER_HOUR`/`MS_PER_DAY`/`startOfNextLocalDay`, extracted from `business-hours.ts` (3.2) so the "today" boundary and the SLA business-hours calc share one offset definition.
- `src/lib/leads/business-hours.ts` -- updated to import the shared constants instead of declaring its own.
- `src/lib/leads/get-lead-risk-alerts.ts` -- "read + categorize in memory" convention followed; `isTerminalLeadStatus` reused.
- `src/lib/leads/list-lead-meetings.ts` -- plain-select DAL convention (no embeds) followed for the meetings query.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/leads/sao-paulo-time.ts` -- new shared timezone constants/helper
- [x] `src/lib/leads/business-hours.ts` -- refactored to reuse the shared constants
- [x] `src/lib/leads/get-daily-agenda-alerts.ts` -- new `getDailyAgendaAlerts(supabase, now?)`
- [x] Tests for all new/changed modules

**Acceptance Criteria:** see I/O matrix above (mirrors FR26 ACs verbatim).

## Implementation Notes

- Implemented directly, self-reviewed inline (no subagent dispatch), per standing token-conservation instruction.
- Flagged and resolved the untyped-relationships pattern in `database.types.ts` per the Anti-Vibe-Coding Gate rather than silently using an embed or silently avoiding the question — chose the plain-query approach since it matches every existing DAL in the codebase.
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (195 tests) all pass.
- Not verified against a live Supabase instance — no CLI/DB access in this environment.
- This is the last story in Epic 3 (Painel de Saúde da Prospecção) — all 3 stories now implemented and self-reviewed (`review` status). `epic-3` stays `in-progress` in `sprint-status.yaml`, same convention as `epic-1`/`epic-2`.

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 195 tests pass, including new coverage for `sao-paulo-time.ts` and `get-daily-agenda-alerts.ts`
