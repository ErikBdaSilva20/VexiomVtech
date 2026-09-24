---
title: 'Story 2.9: Agendar e gerenciar reuniões do lead (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
baseline_commit: '750d21d'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `lead_meetings` and its RLS already exist (Epic 1) but nothing writes to or reads it. FR19 needs scheduling a meeting, marking it realizada/cancelada, and listing all of a lead's meetings.

**Approach:** `createLeadMeeting` (plain insert, DB default handles `status: 'agendada'`), `updateLeadMeetingStatus` (restricted to the `realizada`/`cancelada` targets, with the same optimistic-concurrency pattern as stories 2.7/2.8 since two admins acting on the same meeting is the same class of real "two people, one resource" scenario), and `listLeadMeetings` (chronological read DAL). No schema/RLS change needed. No `/painel-8f2k/leads/[id]` page yet — backend only. This closes out Epic 2.

## Boundaries & Constraints

**Always:**
- `status` is never accepted as client input on creation — the DB default (`'agendada'`) is authoritative.
- `updateLeadMeetingStatus` only allows `realizada`/`cancelada` as the target `status` — never `agendada` (the AC text never describes reverting to scheduled as an admin action through this path).
- `updateLeadMeetingStatus` requires `expected_status` (any of the three states) and conditions the UPDATE on it, reporting `conflict` (with the meeting's actual current status) on a mismatch — same posture as `updateLeadStatus`/`updateLeadAssignee`.
- `listLeadMeetings` returns all meetings (past and future) ordered chronologically by `scheduled_at`.

**Never:**
- No `/painel-8f2k/leads/[id]` page/component in this story.
- No new RLS policy or migration — `lead_meetings_select/insert/update_admins` already cover this.
- No concurrency guard needed on `createLeadMeeting` — multiple meetings per lead are explicitly allowed (FR19), so two admins scheduling different meetings for the same lead at once don't conflict; each insert is independent.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Schedule a meeting | Authenticated admin, valid `scheduled_at` | New `lead_meetings` row, `status: 'agendada'` (DB default) | N/A |
| Malformed `scheduled_at` | — | Field-level error, no DB write | N/A |
| Mark a meeting realizada/cancelada, `expected_status` matches | — | Status updated | N/A |
| Target status `agendada` submitted | — | Field-level error, no DB write | N/A |
| Two admins act on the same meeting near-simultaneously | Second admin's `expected_status` no longer matches | `conflict` with the meeting's actual current status — no silent overwrite | N/A |
| Meeting doesn't exist | — | Generic error (fallback read after the 0-row update finds nothing) | Logged server-side |
| List a lead's meetings | Multiple meetings exist | Returned ordered by `scheduled_at` ascending, past and future included | N/A |

</frozen-after-approval>

## Code Map

- `supabase/setup.sql` (lines 83-93, 283-295) -- `lead_meetings` table + RLS, reused as-is.
- `src/app/painel-8f2k/leads/[id]/actions.ts` -- `updateLeadStatus`/`updateLeadAssignee` (2.7/2.8) are the optimistic-concurrency pattern `updateLeadMeetingStatus` follows; `nullableFormValue` (2.8) reused for `notes`.
- `src/lib/leads/list-lead-interactions.ts` / `list-leads.ts` -- read-DAL convention (throw + log) `listLeadMeetings` follows.
- `src/lib/supabase/database.types.ts` -- `LeadMeetingStatus` type reused as-is for the status enum.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/leads/lead-meeting-schema.ts` -- new `createLeadMeetingSchema`, `updateLeadMeetingStatusSchema`
- [x] `src/lib/leads/list-lead-meetings.ts` -- new `listLeadMeetings(supabase, leadId)`
- [x] `src/app/painel-8f2k/leads/[id]/actions.ts` -- new `createLeadMeeting`, `updateLeadMeetingStatus`
- [x] Tests for all new modules

**Acceptance Criteria:** see I/O matrix above (mirrors FR19 ACs verbatim).

## Implementation Notes

- Implemented directly, self-reviewed inline (no subagent dispatch), per standing token-conservation instruction. Applied the same "guard concurrency only where it's a real two-people-one-resource risk" lens established in 2.7/2.8: `updateLeadMeetingStatus` got the guard (one admin marking a meeting done while another cancels it is realistic); `createLeadMeeting` did not need one (multiple meetings per lead are allowed by design, so concurrent creates don't collide).
- `z.iso.datetime()`'s custom-message form is `{ offset: true, error: "..." }`, not a second positional argument — confirmed via a throwaway script before committing to the syntax (this project's zod version differs from what training data assumes here too, same category of check as the earlier `z.uuid()`/`z.string().uuid()` finding).
- This is the last story in Epic 2 (Lead Capture Management) — all 9 stories are now implemented and self-reviewed (`review` status). `epic-2` itself stays `in-progress` in sprint-status.yaml, matching this file's existing convention (`epic-1` is likewise still `backlog` despite its stories being confirmed done at the start of this session) — the epic-level `done` transition appears to be reserved for a separate, not-yet-defined sign-off step this session didn't perform.
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (164 tests) all pass.
- Not verified against a live Supabase instance — no CLI/DB access in this environment.

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 164 tests pass, including new coverage for `lead-meeting-schema.ts`, `list-lead-meetings.ts`, and `createLeadMeeting`/`updateLeadMeetingStatus` in `[id]/actions.ts`
