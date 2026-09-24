---
title: 'Story 2.7: Alterar status do lead com histórico automático (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'a9da548'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `leads.status` has no application write path and, notably, no DB-level enum constraint either (unlike `lead_meetings.status`/`projects.status`) — today nothing stops an invalid value from being written except future application code. FR12 requires selecting among 10 defined commercial statuses; FR13 requires the change to be auto-logged to the timeline, which the existing `trg_leads_log_status_change` trigger already does.

**Approach:** (1) A DB migration adds a `leads_status_check` constraint mirroring the 10 statuses, as a backstop no future write path can bypass — this is a schema change, hence `route: dispatch`. (2) A single source-of-truth `LEAD_STATUSES`/`leadStatusSchema` module. (3) A Server Action `updateLeadStatus` that performs a plain conditional `UPDATE` (never inserts a `lead_interactions` row itself — the trigger owns that) and, given the user's explicit ask for extra care around two people acting on the same lead at once, uses optimistic concurrency: the caller must supply `expected_status`, and the update is conditioned on the DB still holding that value, so a concurrent status change by another admin can't be silently overwritten.

## Boundaries & Constraints

**Always:**
- `LEAD_STATUSES` (`src/lib/leads/lead-status.ts`) is the single source of truth for the 10 valid slugs; the new `leads_status_check` DB constraint must list the exact same values.
- `updateLeadStatus` must never insert into `lead_interactions` — `trg_leads_log_status_change` already does this on any `UPDATE` where `old.status IS DISTINCT FROM new.status`.
- `updateLeadStatus` requires `expected_status` and conditions the `UPDATE` on it (`.eq("status", expected_status)`), reporting a `conflict` result (with the lead's actual current status) instead of a generic error when 0 rows match due to a status mismatch.
- New SQL goes in `supabase/migrations/0003_leads_status_check_constraint.sql`; `supabase/setup.sql` is not hand-edited; `supabase/migrations.sql` regenerated via `pnpm db:migrations`.

**Never:**
- No `/painel-8f2k/leads/[id]` page/component in this story.
- The optimistic-concurrency check is a data-integrity/UX safeguard, not a security boundary — RLS (`leads_update_admins`) remains the actual authorization enforcement; a malicious/compromised caller could still pass a fabricated `expected_status`, same trust model as any other field on this internal-admin action.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid status, `expected_status` matches DB | Authenticated admin | Status updated; trigger appends `mudanca_status` timeline entry automatically | N/A |
| Status outside the 10 defined values | — | Field-level error, no DB write (FR12 AC3) | N/A |
| Two admins act on the same lead near-simultaneously | Admin A's `expected_status` no longer matches (admin B already changed it) | `conflict` result with the lead's actual current status — no silent overwrite | N/A |
| `lead_id` doesn't exist | — | Generic error (fallback read after the 0-row update finds nothing) | Logged server-side |
| Unauthenticated caller | — | Error, no DB write attempted | N/A |
| Real DB/RLS failure during the update | — | Generic error, no fallback-read attempted (only the "0 rows, no error" / `PGRST116` case triggers the conflict-check path) | Logged server-side |

</frozen-after-approval>

## Code Map

- `supabase/setup.sql` (lines 169-196) -- `trg_leads_log_status_change` trigger, reused as-is; this story's action must never duplicate what it does.
- `supabase/setup.sql` (lines 88-93, 101-104) -- existing `check (status in (...))` pattern on `lead_meetings`/`projects`, copied for the new `leads_status_check` constraint.
- `src/lib/auth/get-current-admin.ts` -- `NO_ROWS_ERROR_CODE = "PGRST116"` convention, mirrored locally in `actions.ts` to distinguish "0 rows" from a real DB error.
- `src/app/painel-8f2k/leads/[id]/actions.ts` -- existing action shapes (2.5/2.6) this story's `updateLeadStatus` follows.

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/0003_leads_status_check_constraint.sql` -- new `leads_status_check` constraint (drop-if-exists + add, idempotent)
- [x] Run `pnpm db:migrations`
- [x] `src/lib/leads/lead-status.ts` -- new `LEAD_STATUSES`, `LeadStatus`, `leadStatusSchema`
- [x] `src/lib/leads/update-lead-status-schema.ts` -- new `updateLeadStatusSchema` (lead_id, status, expected_status)
- [x] `src/app/painel-8f2k/leads/[id]/actions.ts` -- new `updateLeadStatus(_prevState, formData)`
- [x] Tests for all new/changed modules

**Acceptance Criteria:** see I/O matrix above (mirrors FR12 ACs verbatim).

## Implementation Notes

- Implemented directly, self-reviewed inline (no subagent dispatch), per standing token-conservation instruction.
- User explicitly asked for doubled attention to concurrency bugs from two people acting on the same place at once, where it makes sense — this is exactly that scenario (two admins working the same lead list), so optimistic concurrency was added even though the AC text doesn't ask for it verbatim; the AC for story 2.6 already established the same instinct for `viewed_at`, so this follows the same standard already set in this epic.
- `leads.status` had no DB-level enum constraint before this story (confirmed by grep — only `lead_meetings.status`/`projects.status` had one). Added `leads_status_check` as a defense-in-depth backstop mirroring the existing pattern; not strictly required by the AC text (which only asks for app-level rejection) but low-risk and consistent with the rest of the schema.
- The post-conflict fallback read (to report the lead's actual current status) is best-effort/informational only — it can theoretically race with yet another concurrent change, but that only affects the accuracy of the reported `currentStatus` message, never the correctness of the actual (atomically-conditioned) update itself.
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (103 tests) all pass.
- Not verified against a live Supabase instance — no CLI/DB access in this environment. In particular, the new CHECK constraint's behavior against any pre-existing non-conforming row is unverified (this project's only status values seen anywhere are already inside the enum: `novo_lead`, `nao_convertido`, `contrato_fechado`, `em_suporte_continuo`).

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 103 tests pass, including new coverage for `lead-status.ts`, `update-lead-status-schema.ts`, and `updateLeadStatus` in `[id]/actions.ts`
- `pnpm db:migrations` -- regenerates `supabase/migrations.sql`, includes `0003_leads_status_check_constraint.sql`'s content

**Manual checks (if no CLI):**
- Paste `supabase/migrations.sql` (or just the new file) into the Supabase SQL editor for the dev project and confirm it applies without error against existing data.
