---
title: 'Story 2.2: Detecção de duplicidade na criação de lead (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `POST /api/leads` (story 2.1) always inserts with `possible_duplicate_of: null`, so the team has no way to spot that a new lead shares contact info with an existing one. This check must run on every lead creation path, current (public form) and future (story 2.3's manual admin entry), without blocking creation either way.

**Approach:** Add a reusable `findDuplicateLeadId(supabase, { email, whatsapp })` helper that queries `leads` for the oldest existing row sharing the same e-mail (case-insensitive) or WhatsApp, and wire it into `POST /api/leads` before the insert. If the duplicate check itself fails, log and proceed with `null` — detection is a courtesy, never a hard requirement for lead capture.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No existing match | New email/whatsapp not used by any lead | `possible_duplicate_of` stays `null` | N/A |
| Match by email | Existing lead with same email (any case), different whatsapp | `possible_duplicate_of` = id of the oldest matching lead | N/A |
| Match by whatsapp | Existing lead with same whatsapp, different email | `possible_duplicate_of` = id of the oldest matching lead | N/A |
| Match by both, different leads | Lead A matches by email, Lead B (older) matches by whatsapp | `possible_duplicate_of` = id of whichever matching lead is oldest overall | N/A |
| Duplicate-check query fails | Supabase query throws/errors | Lead is still created with `possible_duplicate_of: null` | Error logged server-side, request still returns 201 |

</frozen-after-approval>

## Code Map

- `src/lib/leads/lead-schema.ts` -- reuse `publicLeadSchema` as-is; add `.toLowerCase()` to the `email` field so stored/compared emails are case-normalized (small, in-scope fix — case-sensitive email matching would silently miss real duplicates).
- `src/app/api/leads/route.ts` -- call the new duplicate-check helper after Zod validation, before the insert; pass its result as `possible_duplicate_of`.
- `src/lib/supabase/database.types.ts` -- `LeadsRow`/`LeadsInsert` already type `possible_duplicate_of` and `created_at`; no changes.
- `supabase/setup.sql` (leads table) -- no schema change; `possible_duplicate_of` column and self-referencing FK already exist.
- Reuse target for story 2.3: the new helper takes a `SupabaseClient<Database>` parameter (not hardcoded to the admin client) so the future manual-entry Server Action can pass its own client.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/leads/lead-schema.ts` -- add `.toLowerCase()` transform to `publicLeadSchema.email`
- [ ] `src/lib/leads/duplicate-detection.ts` -- new `findDuplicateLeadId(supabase, { email, whatsapp }): Promise<string | null>`: queries `leads` with `.or("email.eq.<email>,whatsapp.eq.<whatsapp>")`, `.order("created_at", { ascending: true })`, `.limit(1)`; returns the matched row's `id` or `null`; catches/logs any query error and returns `null` rather than throwing
- [ ] `src/app/api/leads/route.ts` -- call `findDuplicateLeadId` after validation, before insert; set `possible_duplicate_of` on the insert payload from its result
- [ ] `src/lib/leads/duplicate-detection.test.ts` -- unit tests covering the I/O matrix (mocking the Supabase client the same way `route.test.ts` mocks `createAdminClient`)
- [ ] `src/app/api/leads/route.test.ts` -- extend existing tests to assert `possible_duplicate_of` is wired from the duplicate-check result

**Acceptance Criteria:**
- Given an existing lead with the same e-mail, when a new lead is created, then the new lead's `possible_duplicate_of` is the oldest matching lead's id
- Given an existing lead with the same WhatsApp but different e-mail, when a new lead is created, then the same detection applies
- Given no existing lead shares e-mail or WhatsApp, when a new lead is created, then `possible_duplicate_of` stays `null`
- Given the duplicate-check query fails, when a new lead is created, then the lead is still created successfully with `possible_duplicate_of: null`

## Implementation Notes

- `src/lib/leads/lead-schema.ts` -- added `.toLowerCase()` to `email` so duplicate matching and storage are case-insensitive.
- `src/lib/leads/duplicate-detection.ts` -- `findDuplicateLeadId` implemented as two independent `.eq()` queries (by email, by whatsapp) run in parallel via `Promise.all`, rather than a single `.or("email.eq.<value>,...")` filter string. Reason: `whatsapp` has no format validation (free text), so interpolating it into a PostgREST filter expression risks changing the query's meaning if it ever contains a comma/dot/paren — safer to use the query-builder's own escaping via `.eq()`. Each query already orders by `created_at` ascending and takes the first row, so no in-memory sort was needed across a field's own matches; only the two candidates (one per field) are compared to pick the overall oldest.
- `src/app/api/leads/route.ts` -- calls `findDuplicateLeadId` after validation, before insert; result feeds `possible_duplicate_of` directly on the insert payload.
- `src/lib/leads/duplicate-detection.test.ts` and extended `src/app/api/leads/route.test.ts` cover every I/O matrix scenario, including the query-failure-still-creates-lead case.
- `pnpm tsc --noEmit`, `pnpm lint`, and `pnpm test` (21 tests) all pass.
- No schema/migration change — `possible_duplicate_of` column and FK already existed.
- Blind Hunter review (post-implementation): 2 real issues patched (JSDoc block misplaced above the wrong declaration; missing test for `findDuplicateLeadId` throwing an unexpected exception, not just returning a Supabase error). 1 false finding rejected (claimed mock fragility from a "shared mutable field variable" across concurrent `.eq()` calls — disproved: `from()` is a factory invoked once per call, so each invocation closes over its own independent `field` variable, no cross-call interference). Remaining findings (WhatsApp normalization, TOCTOU race on near-simultaneous duplicate submissions, tie-break rule for equal timestamps, excluding disqualified/soft-deleted leads from matching, API doc update) deferred — see `deferred-work.md`; the WhatsApp-format finding duplicates an existing entry from story 2.1's review.
- `pnpm tsc --noEmit`, `pnpm lint`, and `pnpm test` (22 tests) all pass after patches.

## Verification

**Commands:**
- `pnpm lint` -- expected: no errors
- `pnpm tsc --noEmit` -- expected: no type errors
- `pnpm test` -- expected: all tests pass, including new duplicate-detection coverage

## Review Triage Log

- **patch** (`low`): JSDoc block documenting `findDuplicateLeadId` was placed above the `LeadMatch` type instead. Moved to the correct declaration.
- **patch** (`medium`): No test covered `findDuplicateLeadId`'s underlying query throwing an unexpected exception (vs. returning a Supabase `error` object) — the outer `try/catch` in the route already handles it, but the path was unverified. Added a route-level test asserting a generic 500 with no leaked detail.
- **false**: Reviewer claimed the test mocks' `field` variable is shared/racy across the two parallel `.eq()` calls. Disproved: `from` is a `vi.fn().mockImplementation()` factory invoked once per `supabase.from("leads")` call; each invocation creates its own closure with an independent `field` binding, so the two concurrent `findByField` calls never share state.
- **defer**: WhatsApp values aren't normalized before comparison (formatting differences like `+55 (11) 99999-9999` vs `11999999999` won't match). Duplicates the existing `deferred-work.md` entry from story 2.1 about deciding a normalized WhatsApp format — same root cause, no new entry added.
- **defer** (documented instead, not code-fixed): TOCTOU race — two near-simultaneous submissions with the same contact info can both miss each other since neither insert has committed when the other's check runs. No unique constraint exists (duplicates are meant to be flagged, not blocked, per FR6), so this is an inherent limitation of a "flag, don't block" design; documented in `findDuplicateLeadId`'s JSDoc rather than deferred as a bug.
- **reject** (`low`): No tie-break rule specified/tested for two matches with identical `created_at`. Sub-millisecond ties are not a realistic occurrence for this table's write volume; not worth the added complexity.
- **reject** (`low`): No filtering of soft-deleted/disqualified leads from duplicate matching. The `leads.status` enum has no such state (see Epic 2 context — closed set of commercial statuses only), so there is nothing to filter; would be inventing a requirement.
- **reject**: No public API doc exists for `/api/leads` to update — nothing to reject or defer, the artifact doesn't exist in this project.
