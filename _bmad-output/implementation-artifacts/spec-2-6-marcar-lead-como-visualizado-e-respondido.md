---
title: 'Story 2.6: Marcar lead como visualizado e respondido (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
baseline_commit: '899d325'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `leads.viewed_at`/`leads.responded_at` already exist (Epic 1 schema) but nothing writes to them. FR11: `viewed_at` auto-fills on first open and must never be overwritten afterward; `responded_at` fills when an admin manually marks a lead as responded.

**Approach:** `viewed_at` is a passive side effect of opening the lead detail page — implemented as a plain DAL (`markLeadViewed`) using one atomic conditional `UPDATE ... WHERE viewed_at IS NULL`, avoiding a read-then-write race. `responded_at` is an explicit admin action — implemented as a Server Action (`markLeadResponded`) that always overwrites with the current time, since the ACs only require idempotency for `viewed_at`. No `/painel-8f2k/leads/[id]` page yet — backend only.

## Boundaries & Constraints

**Always:**
- `markLeadViewed` must use a single atomic UPDATE guarded by `viewed_at IS NULL` — never a separate SELECT to check before UPDATE (check-then-act race).
- `markLeadResponded` validates `lead_id` as a UUID and requires an authenticated admin before touching the DB (defense-in-depth alongside RLS).
- Both use the session-aware `createClient()` — RLS (`leads_update_admins`) is the actual enforcement layer.
- Generic error messages only — no raw Postgres/Supabase error text returned to the caller.

**Never:**
- No `/painel-8f2k/leads/[id]` page/component in this story.
- No new RLS policy or migration — `leads_update_admins` already covers this.
- `markLeadViewed` never throws — a failure to record "viewed" must not break page rendering.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lead never viewed | `viewed_at` is null | `markLeadViewed` sets it to now | N/A (swallowed on failure, see below) |
| Lead already viewed | `viewed_at` already set | No change — the `IS NULL` guard matches 0 rows | N/A |
| Concurrent first-open from two admins | Both call `markLeadViewed` near-simultaneously | Only the first committed UPDATE wins; the second matches 0 rows (row-lock serialization, not app-level locking) | N/A |
| `markLeadViewed` query fails | DB error | Logged, function still resolves (no throw) | Swallowed by design |
| Admin marks lead responded, authenticated | Valid `lead_id` | `responded_at` set to now, overwriting any previous value | N/A |
| `markLeadResponded` unauthenticated | No session | Error, no DB write attempted | N/A |
| `markLeadResponded` with a malformed `lead_id` | Not a UUID | Error, no DB write attempted | N/A |
| `markLeadResponded` update fails or matches no lead | RLS denies / lead doesn't exist | Generic error returned | Logged server-side |

</frozen-after-approval>

## Code Map

- `supabase/setup.sql` (lines 56-58, 250-253) -- `leads.viewed_at`/`responded_at` columns and `leads_update_admins` RLS policy, reused as-is.
- `src/lib/leads/list-leads.ts` / `list-lead-interactions.ts` -- DAL convention for read paths (throw + log). `markLeadViewed` deliberately deviates (swallow + log) — documented inline why.
- `src/app/painel-8f2k/leads/[id]/actions.ts` -- `createLeadInteraction` (story 2.5) is the Server Action shape `markLeadResponded` follows.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/leads/mark-lead-viewed.ts` -- new `markLeadViewed(supabase, leadId)`, atomic conditional update, swallow-and-log on failure
- [x] `src/app/painel-8f2k/leads/[id]/actions.ts` -- new `markLeadResponded(_prevState, formData)`
- [x] Tests for both

**Acceptance Criteria:** see I/O matrix above (mirrors FR11 ACs verbatim).

## Implementation Notes

- Implemented directly, self-reviewed inline (no subagent dispatch), per standing token-conservation instruction. User explicitly asked for extra care on error handling and security for this story even though it's small — treated as a prompt to double-check the race-condition and defense-in-depth angles, not just get the happy path working.
- `markLeadViewed` is the one function in this codebase that intentionally never throws on a DB error — documented inline why this breaks from the `listLeads`/`listLeadInteractions` throw-and-log convention (viewing a lead is a side effect, not data the page needs to render).
- `markLeadResponded` re-selects the updated row (`.select("id").single()`) specifically so a 0-row update (bad id, RLS denial) surfaces as an error instead of silently reporting success.
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (80 tests) all pass.
- Not verified against a live Supabase instance — no CLI/DB access in this environment. The concurrent-open race-safety claim rests on Postgres's standard row-locking behavior for `UPDATE ... WHERE`, not on an integration test against a real DB.

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 80 tests pass, including new coverage for `mark-lead-viewed.ts` and `markLeadResponded` in `[id]/actions.ts`
