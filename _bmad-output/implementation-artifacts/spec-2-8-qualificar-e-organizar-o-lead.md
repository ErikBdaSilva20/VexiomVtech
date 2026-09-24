---
title: 'Story 2.8: Qualificar e organizar o lead (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
baseline_commit: 'd834399'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `next_action`/`next_action_at`/`probability`/`tags`/`non_conversion_reason`/`assigned_to` all already exist on `leads` (Epic 1 schema) but have no write path. FR14-FR18 cover five largely independent qualification/organization concerns.

**Approach:** Five focused Server Actions (one per FR/AC, not one kitchen-sink update) sharing a small `updateLeadFields` DAL helper for the plain cases. `assigned_to` gets the same optimistic-concurrency treatment as story 2.7's status change, since two admins racing to claim the same unassigned lead is a real scenario; the other four fields are ordinary metadata edits where last-write-wins is the expected, unsurprising behavior — no AC asks for anything else there, so no concurrency guard was added for them (considered and deliberately skipped, not overlooked).

## Boundaries & Constraints

**Always:**
- One action per concern: `updateLeadNextAction`, `updateLeadProbability`, `updateLeadTags`, `updateLeadNonConversionReason`, `updateLeadAssignee`.
- `updateLeadAssignee` requires `expected_assigned_to` (nullable) and conditions its UPDATE on it, reporting `conflict` (with the lead's actual current `assigned_to`) instead of silently overwriting a concurrent claim.
- `updateLeadTags` replaces the full tag array (not incremental add/remove) — the caller always sends the complete desired list.
- Reuse `optionalText`/`MAX_SHORT_TEXT`/`MAX_LONG_TEXT` from `lead-schema.ts` rather than redefining text-field validation.
- Each field independently update-able and clearable (empty input → `null`), without requiring the others to be resubmitted.

**Never:**
- No `/painel-8f2k/leads/[id]` page/component in this story.
- `non_conversion_reason` is NOT tied to `status === 'nao_convertido'` at the backend — the AC only requires the *field* to become available in the UI at that point (a frontend concern). Enforcing this at the DB/action layer would create a cross-cutting dependency on story 2.7's `updateLeadStatus` (what happens when status later changes away from `nao_convertido`?) that is out of scope here.
- No concurrency guard added for `next_action`/`probability`/`tags`/`non_conversion_reason` — plain metadata, last-write-wins is acceptable and expected.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Set next_action + next_action_at | Authenticated admin | Both saved together | N/A |
| Clear next_action/next_action_at | Empty input | Set to `null` | N/A |
| Set probability | `baixa`/`media`/`alta` | Saved | N/A |
| Invalid probability | Outside enum | Field-level error, no DB write | N/A |
| Replace tags | Array of non-empty strings | Full array saved, replacing the old one | N/A |
| Empty tag in the array | e.g. `[""]` | Field-level error, no DB write | N/A |
| Set non-conversion reason | Any status | Saved (no status check) | N/A |
| Assign an unassigned lead | `expected_assigned_to: null` matches DB | Assigned | N/A |
| Two admins race to claim the same lead | Second admin's `expected_assigned_to` no longer matches | `conflict` with the actual current `assigned_to` — no silent overwrite | N/A |
| Unauthenticated caller (any of the five) | No session | Error, no DB write attempted | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/leads/lead-schema.ts` -- `optionalText`/`MAX_SHORT_TEXT`/`MAX_LONG_TEXT` exported and reused (extended in this story to be exported).
- `src/app/painel-8f2k/leads/[id]/actions.ts` -- `updateLeadStatus` (2.7) is the optimistic-concurrency pattern `updateLeadAssignee` follows; a new `nullableFormValue` helper was extracted here and also applied to `createLeadInteraction` (2.5), removing a small duplicated inline conditional.
- `src/lib/leads/update-lead-fields.ts` -- new shared DAL helper for the four plain-update actions.
- `src/lib/supabase/database.types.ts` -- `LeadProbability` type reused as-is for the probability enum.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/leads/lead-schema.ts` -- export `optionalText`
- [x] `src/lib/leads/lead-qualification-schema.ts` -- new schemas for all five concerns
- [x] `src/lib/leads/update-lead-fields.ts` -- new shared `updateLeadFields` helper
- [x] `src/app/painel-8f2k/leads/[id]/actions.ts` -- five new Server Actions + `nullableFormValue` helper (also applied to `createLeadInteraction`)
- [x] Tests for all new/changed modules

**Acceptance Criteria:** see I/O matrix above (mirrors FR14-FR18 ACs verbatim).

## Implementation Notes

- Implemented directly, self-reviewed inline (no subagent dispatch), per standing token-conservation instruction. User asked again for doubled attention to concurrent-edit bugs "where it makes sense" — applied that lens per field: `assigned_to` got the same guard as 2.7's status (real "two people, one resource" race); the other four did not, since Postgres updates targeting only their own column can't clobber a concurrent edit to a *different* column on the same row anyway (each `UPDATE` only touches the columns it names), and none of their ACs require first-write-wins or historical logging the way `viewed_at`/status changes do.
- Considered one kitchen-sink `updateLeadQualification` action accepting a partial payload instead of five actions; rejected because FormData has no clean way to distinguish "field omitted, leave unchanged" from "field cleared" across a dynamically-partial payload without extra sentinel fields, whereas five single-purpose actions (matching the AC structure) sidestep the ambiguity entirely and stay simple.
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (140 tests) all pass.
- Not verified against a live Supabase instance — no CLI/DB access in this environment.

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 140 tests pass, including new coverage for `lead-qualification-schema.ts`, `update-lead-fields.ts`, and the five new actions in `[id]/actions.ts`
