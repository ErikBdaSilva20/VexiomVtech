---
title: 'Story 2.4: Listagem de leads com busca e filtros (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
baseline_commit: '0013793'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no query/data-access layer for listing leads. FR8 requires search (name/company/email/whatsapp) combined with AND-able filters (status, tag, project_type, assigned_to).

**Approach:** Add a read-only DAL function `listLeads` under `src/lib/leads/`, backed by the existing `leads_select_admins` RLS policy (no schema change needed — the select policy from Epic 1/2.1 already covers `super_admin`/`employer`). Search across the four text columns uses a single `.or()` PostgREST filter with a new escaping utility, since a naive interpolation would repeat the filter-injection risk already avoided in `findDuplicateLeadId` (story 2.2) — but unlike that function's free-text equality lookups, a 4-column OR search is impractical to split into independent queries with correct pagination, so this story fixes the risk with documented PostgREST value-escaping instead of avoiding `.or()` altogether. No page/route yet — backend only, same boundary as 2.1-2.3 (frontend being built separately with Codex, out of scope for this agent).

## Boundaries & Constraints

**Always:**
- Reuse the existing `leads_select_admins` RLS policy — no new migration.
- Escape any free-text `search` term before interpolating into `.or()` via a documented, tested utility (`escapeIlikeOrFilterValue`).
- `status`, `project_type`, `assigned_to` use `.eq()`; `tag` uses `.contains()` — all parameterized by supabase-js, never string-interpolated.
- Caller supplies a session-aware `SupabaseClient<Database>` (RLS is the enforcement layer, consistent with 2.3).
- Validate/parse all incoming filter values (untyped query params) through `listLeadsQuerySchema` before they reach `listLeads`.

**Never:**
- No new `/painel-8f2k/leads` page/route in this story — backend only.
- No changes to `leads` RLS policies or schema.
- No use of the service-role client for this path (it's an authenticated admin read, not the untrusted public path).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| No filters | `{}` | First page (20) of all leads ordered by `created_at desc`, `total` = full count | N/A |
| Search term | `search: "erik"` | Leads where name/company/email/whatsapp ilike-matches "erik" | N/A |
| Search term with PostgREST-special chars | `search: "a,b(c)"` | Matched literally (escaped), does not alter/break the filter | N/A |
| Combined filters | `status` + `tag` + `project_type` + `assigned_to` together | Only leads satisfying all of them (AND) | N/A |
| Pagination | `page: 3, page_size: 10` | Rows 21-30 | N/A |
| Invalid filter shape | e.g. `assigned_to` not a UUID | `listLeadsQuerySchema.safeParse` fails before `listLeads` is called | Caller surfaces a validation error |
| Query failure | Supabase returns an error | Function throws a generic error | Logged server-side via `console.error` |

</frozen-after-approval>

## Code Map

- `supabase/setup.sql` (lines 245-248) -- `leads_select_admins` policy, reused as-is.
- `src/lib/leads/duplicate-detection.ts` -- established precedent for avoiding raw PostgREST filter injection; this story extends the same concern to a multi-column `.or()` search instead of splitting into independent queries.
- `src/lib/supabase/database.types.ts` -- `Database["public"]["Tables"]["leads"]["Row"]` is the row type returned.
- `src/lib/leads/lead-schema.ts` -- existing schema-module convention (Zod, `MAX_*` constants) followed for the new query schema.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/leads/postgrest-filter.ts` -- new `escapeIlikeOrFilterValue(value: string): string`, escaping `\ , . ( ) % _`
- [x] `src/lib/leads/list-leads-schema.ts` -- new `listLeadsQuerySchema` (search/status/tag/project_type/assigned_to optional, page/page_size with defaults 1/20, max page_size 100)
- [x] `src/lib/leads/list-leads.ts` -- new `listLeads(supabase, filters)` returning `{ leads, total, page, pageSize }`
- [x] Tests for all three new modules

**Acceptance Criteria:**
- Given multiple leads exist, when an admin searches by a term, then only leads whose name/company/email/whatsapp match are returned
- Given one or more filters (status, tag, project_type, assigned_to) are set, when combined, then only leads satisfying all of them are returned
- Given a search term contains characters meaningful to PostgREST's filter grammar, when searched, then the term is matched literally, not interpreted as filter syntax

## Implementation Notes

- Implemented directly (no subagent dispatch), per user's token-conservation instruction for the rest of the session — includes self-review (Blind Hunter/Edge Case/Verification Gap performed inline, not via subagents).
- `z.string().uuid()` does not exist as a chainable in this project's zod version; used top-level `z.uuid()` instead (found via a quick script check against a real UUID during test-writing — a v4 UUID with a valid variant nibble was required, since zod validates the variant, not just the general 8-4-4-4-12 shape).
- Added a `server-only` → empty-module alias in `vitest.config.ts` (new `test/empty-module.ts`) since `list-leads.ts` imports `server-only` (matching `get-current-admin.ts`/`admin.ts`'s convention) and vitest's node environment isn't Next's server bundler. This unblocks testing any future `server-only`-guarded module too, not just this one.
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (52 tests) all pass.
- Not verified against a live Supabase instance (no CLI/DB access in this environment) — the `.or()` escaping is verified by unit test against the exact string PostgREST expects per its documented escaping rules, not against a running PostgREST server.

## Self-Review (performed directly, no subagent)

- **Auth check inside `listLeads`?** Not added — deliberate. Consistent with the layered model established in 2.1-2.3: `/painel-8f2k/*` middleware enforces session+role, RLS enforces row access, and this DAL trusts both layers rather than re-checking `getCurrentAdmin()` itself (same posture as `findDuplicateLeadId`, which also has no internal auth check).
- **Escaping correctness**: verified `escapeIlikeOrFilterValue` escapes backslash first (so a trailing `\` in user input can't consume the next inserted escape character) — covered by a dedicated test with a literal backslash + comma input.
- **Out-of-range pagination**: `range()` beyond available rows returns an empty array from Supabase, not an error — no explicit guard needed.
- **Deferred, not fixed**: `ilike` search is ASCII case-insensitive only; accented terms (common in Portuguese names) won't fuzzy-match their unaccented form. Logged to `deferred-work.md` — not a regression, same behavior any Postgres `ilike` has without an extension, and no FR requires accent-insensitive search.
- **Deferred, not fixed**: escaping `%`/`_` means a user literally typing `%` searches for a literal percent sign, not a wildcard — this is the safer default and no requirement asks for user-controlled wildcards; logged as a UX note only.

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 52 tests pass, including new coverage for `postgrest-filter.ts`, `list-leads-schema.ts`, `list-leads.ts`
