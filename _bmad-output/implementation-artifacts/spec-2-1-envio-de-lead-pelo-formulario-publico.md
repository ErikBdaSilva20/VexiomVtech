---
title: 'Story 2.1: Envio de lead pelo formulário público (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no server-side endpoint to create a `leads` row. The schema (`public.leads`), triggers, and RLS already exist from Epic 1, but nothing writes to it yet. This is backend-only work; the public contact form UI is wired in a later pass by explicit user decision.

**Approach:** Add a Zod schema for the lead payload (shared with the future manual-creation story 2.3) and a `POST /api/leads` Route Handler that validates the payload, inserts via `createAdminClient()` (service role, bypasses RLS per NFR3), and returns a clear success/error JSON response. No duplicate detection yet (story 2.2) — `possible_duplicate_of` stays null here.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path, required fields only | Valid JSON body with name, email, whatsapp, project_type, description | 201, lead row created with `status: 'novo_lead'`, `source: 'site'`, optional fields null | N/A |
| Happy path, all fields | Valid JSON body including company, desired_deadline, budget_range, preferred_channel, preferred_time | 201, lead row created with all fields populated | N/A |
| Missing required field | JSON body missing e.g. `email` | 400 | JSON body names the invalid field(s) via Zod flatten, no DB write attempted |
| Malformed JSON body | Non-JSON or empty body | 400 | JSON error response, no DB write attempted |
| DB insert failure | Valid payload, Supabase insert throws | 500 | Generic JSON error message (no internal detail leaked), no partial success implied |

</frozen-after-approval>

## Code Map

- `src/lib/supabase/admin.ts` -- reuse `createAdminClient()` as-is for the insert (service role, bypasses RLS per NFR3).
- `src/lib/supabase/database.types.ts` -- `LeadsInsert` type already covers all columns; reuse directly, no changes.
- `supabase/setup.sql` (lines 42-67) -- `leads` table already has all required columns, defaults (`status='novo_lead'`, `source='site'`), and no NOT NULL beyond name/email/whatsapp/project_type/description — nothing to migrate.
- `src/app/(marketing)/contato/page.tsx` / `src/components/contact/contact-form.tsx` -- existing public form UI; explicitly OUT of scope for this story (backend-first decision) — do not touch.

## Tasks & Acceptance

**Execution:**
- [ ] `src/lib/leads/lead-schema.ts` -- new Zod schema `publicLeadSchema` (name, email, whatsapp, project_type, description required; company, desired_deadline, budget_range, preferred_channel, preferred_time optional/nullable strings) -- single source of truth reused by story 2.3's manual-entry schema later
- [ ] `src/app/api/leads/route.ts` -- new `POST` Route Handler: parse JSON, `safeParse` with `publicLeadSchema`, on failure return 400 with flattened Zod errors, on success insert via `createAdminClient().from("leads").insert(...)` with `source: "site"`, return 201 with the created lead's `id` on success, 500 with a generic message on insert failure

**Acceptance Criteria:**
- Given a valid payload with all required fields, when `POST /api/leads` is called, then a `leads` row is created with `status='novo_lead'`, `source='site'`, and a 201 response is returned
- Given a payload missing a required field, when `POST /api/leads` is called, then a 400 response is returned naming the invalid field(s) and no row is created
- Given optional fields are omitted, when `POST /api/leads` is called, then the lead is created with those columns `null`
- Given the Supabase insert throws, when `POST /api/leads` is called, then a 500 response is returned without leaking internal error detail

## Implementation Notes

- `src/lib/leads/lead-schema.ts` -- `publicLeadSchema` created. Optional fields use a shared `optionalText(maxLength)` helper (`.trim().max(...).nullish().transform(...)`) that normalizes empty string / undefined / null all to `null`, since `LeadsInsert` types those columns as `string | null`.
- `src/app/api/leads/route.ts` -- `POST` handler created. Malformed JSON and Zod validation failures both return 400 before any DB call; insert always forces `source: "site"` server-side (never trusts a client-supplied source); both the DB insert and `createAdminClient()` itself are inside the `try/catch`, so any failure (including a missing env var) returns the same generic 500 without leaking internal detail.
- Project had zero test infrastructure. Set up Vitest (`vitest.config.ts`, `pnpm test` script) after a review flag — decided with the user rather than assumed, since it's a project-wide convention, not just this story. Used Vite's native `resolve.tsconfigPaths` option (no extra plugin dependency) to resolve the `@/*` alias.
- `src/lib/leads/lead-schema.test.ts` and `src/app/api/leads/route.test.ts` added, covering every I/O matrix scenario (happy path, all-optional-fields, missing required field, malformed JSON, insert failure, admin-client-throws). `createAdminClient` is mocked at the module boundary in the route test.
- Blind Hunter review (post-implementation) found 2 issues worth fixing now (missing max-length bounds; `createAdminClient()` call unprotected by try/catch) — both patched. Four other findings were deferred (rate limiting/spam protection, WhatsApp format normalization, `preferred_channel`/`preferred_time` enum, and — superseded by the test-infra decision above — automated tests) — see `deferred-work.md`.
- `pnpm tsc --noEmit`, `pnpm lint`, and `pnpm test` (15 tests) all pass.
- No migration needed — `leads` table, defaults, and RLS already existed from Epic 1's `supabase/setup.sql`.

## Verification

**Commands:**
- `pnpm lint` -- expected: no errors in new files
- `pnpm tsc --noEmit` -- expected: no type errors
- `pnpm test` -- expected: all tests pass (15/15)

**Manual checks (if no CLI):**
- `curl -X POST http://localhost:3000/api/leads -H "Content-Type: application/json" -d '{"name":"Test","email":"a@a.com","whatsapp":"11999999999","project_type":"site","description":"test"}'` against local dev server with `.env.local` Supabase vars set -- expect 201 and a new row visible in the Supabase `leads` table

## Review Triage Log

- **patch** (`high`): `createAdminClient()` called outside `try/catch` in the route -- would throw unhandled and break the "generic 500, no leaked detail" contract on a missing/bad env var. Fixed by wrapping the whole DB-access block in `try/catch`.
- **patch** (`medium`): No max-length bounds on any string field -- allowed unbounded payload size per field. Fixed by adding `.max()` to every field in `publicLeadSchema` (200 chars short text, 5000 chars for `description`).
- **defer** (`medium`, unverified severity if abused): No rate limiting/spam protection or Origin allow-list on the public endpoint. Real gap, but no rate-limiting infra exists anywhere in the project and the smallest fix requires a product decision (CAPTCHA vs honeypot vs throttle) — see `deferred-work.md`.
- **defer** (`low`-to-`medium`, needs product input): `whatsapp` has no format/pattern validation. No FR/epic doc defines the expected format; deferred to be settled alongside story 2.2's duplicate-detection matching logic — see `deferred-work.md`.
- **defer** (`low`, needs product input): `preferred_channel`/`preferred_time` are free text instead of closed enums. No documented taxonomy exists to validate against; deferred — see `deferred-work.md`.
- **reject** (`low`): No structured logging/correlation id beyond `console.error`. Not warranted at this app's current size; would add scope without a concrete need.
- **reject** (`low`): `optionalText`'s error message for a wrong-typed value (e.g. a number) is Zod's generic type error rather than a domain-specific one. Cosmetic — required fields already have friendly messages, and this only affects a malformed client that isn't sending strings.
- **superseded**: No automated tests existed for the new code. Raised as a `high`-leaning finding, but the true root cause is that the project has zero test infrastructure — a project-wide decision, not a fix local to this story. Asked the user, who chose to set up Vitest now; tests for both new files were added as part of this story (see Implementation Notes), so this finding is resolved rather than deferred.
