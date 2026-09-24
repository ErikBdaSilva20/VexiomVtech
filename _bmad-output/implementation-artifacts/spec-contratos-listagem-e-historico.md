---
title: 'Contratos: listagem e histórico'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '06be0ece4088ad26aaeb88079b327b4a63622a9f'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Contracts can be created (Story 1) and downloaded (Story 2), but there is no way to read back the full set of registered contracts — a super_admin has no data source to see everything that's been closed. Backend-only scope; the listing page/table UI is Codex's.

**Approach:** A paginated `listContracts` read function (mirroring `listLeads`'s page/page_size/order-by-created_at shape) that joins in the lead's name (readable directly — `leads` RLS already allows super_admin/employer select) and the creating admin's name (requires the same service-role escape hatch as `getFinancialCharts`'s `resolvePartnerNames`, since `admin_users` RLS is self-row-only even for super_admin — gated on `admin.role === "super_admin"` inside the function, not left as caller discipline). The raw storage path is never returned — only a derived `has_file: boolean`.

## Boundaries & Constraints

**Always:** Restricted to `super_admin` via `requireSuperAdmin` at the call site (a Server Action or the caller of this read function — the function itself takes `admin: CurrentAdmin` and re-checks the role before touching `admin_users`, same defense-in-depth shape as `getFinancialCharts`). `file_object_path` is never included in the returned shape — only `has_file`.

**Never:** No search/filter beyond simple pagination (ordered by `created_at desc`) — not asked for, don't invent it. No UI. No changes to `create-contract.ts`/the download route.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Contracts exist | N contracts across 2+ pages | Correct page slice, `total` reflects full count, ordered newest-first | N/A |
| No contracts | Empty table | `{ contracts: [], total: 0 }` | N/A |
| Contract with no file | `file_object_path` is null | `has_file: false` | N/A |
| Contract with file | `file_object_path` set | `has_file: true`, path itself absent from the result | N/A |
| Creator name lookup | Two contracts created by the same admin | One `admin_users` lookup batched for all distinct `created_by` ids on the page, not one per row | N/A |
| Non-super_admin caller passed in | `admin.role !== 'super_admin'` | `admin_users` is never queried; creator name resolves to `null` for every row rather than throwing | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/leads/list-leads.ts`, `src/lib/leads/list-leads-schema.ts` -- pagination/ordering shape to mirror (`page`/`page_size` Zod schema with `optionalFilter`-style helpers as needed, `.range()` + `{ count: 'exact' }`, order by `created_at` descending)
- `src/lib/finance/get-financial-charts.ts:52-66` -- `resolvePartnerNames` is the exact pattern to mirror for resolving `contracts.created_by` display names: `createAdminClient()` (service-role, bypasses RLS) scoped via `.in('user_id', ids)`, gated on `admin.role === 'super_admin'` inside the function before ever calling it — not just documented, enforced
- `src/lib/supabase/admin.ts` -- `createAdminClient()`, reuse as-is
- `src/lib/auth/get-current-admin.ts` -- `CurrentAdmin` type for the function's `admin` parameter
- `src/lib/contracts/contract-schema.ts` -- `CONTRACT_SERVICE_TYPES` type reference for the row shape
- `src/lib/supabase/database.types.ts` -- `Database["public"]["Tables"]["contracts"]["Row"]` / `["leads"]["Row"]` / `["admin_users"]["Row"]` already exist, no new types needed here

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/contracts/list-contracts-schema.ts` -- `listContractsQuerySchema`: `page`/`page_size` only (same bounds as `list-leads-schema.ts`: page ≥ 1, page_size 1-100 default 20) -- no search/filter fields, per Boundaries & Constraints
- [x] `src/lib/contracts/list-contracts.ts` -- `listContracts(supabase, admin, query)`: paginated fetch from `contracts` ordered by `created_at desc`, batch-fetches lead names (`leads` table, session client, `.in('id', ids)`) and creator names (`resolvePartnerNames`-style helper against `admin_users` via `createAdminClient()`, gated on `admin.role === 'super_admin'`), maps `file_object_path` to `has_file: boolean` and drops the raw path from the returned shape
- [x] Colocated `.test.ts` for both files, including every I/O Matrix row

**Acceptance Criteria:**
- Given 25 contracts and `page_size: 20`, when `listContracts` runs for page 2, then it returns the remaining 5 and `total: 25`.
- Given a returned contract, when inspected, then the object has no `file_object_path` key at all — only `has_file`.
- Given `admin.role !== 'super_admin'` is passed in, when `listContracts` runs, then no query against `admin_users` is made and every row's creator name is `null`.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Three layers (Blind Hunter, Edge Case Hunter, Verification Gap) reviewed the diff. All findings verified against actual code before routing.

- **low — patch**: no test covers the `leads` `.in()` lookup erroring, nor `resolveCreatorNames`'s `admin_users` query erroring — both silently fall back (`null` names / empty map), and neither path is verified. Fix: add one test per branch.
- **low — patch**: no test covers a `page` beyond the last page (e.g. page 999 against 3 total rows) confirming `{ contracts: [], total: 3 }` rather than a Supabase range error surfacing. Fix: add the test.
- **low — patch**: `resolveCreatorNames`'s doc comment claims it's "the same defense-in-depth shape as `resolvePartnerNames`" — verified false: `resolvePartnerNames` (`get-financial-charts.ts:52-66`) takes no `admin`/role parameter and performs no internal check at all; its gate lives entirely in its caller (`getFinancialCharts`'s ternary). `resolveCreatorNames` is actually stricter — it self-gates internally. Fix: reword the comment to state this accurately (this function improves on the precedent rather than merely mirroring it), so a future reader doesn't copy `resolvePartnerNames` elsewhere believing it already self-gates.
- **low — defer**: `.order("created_at", { ascending: false })` has no secondary tie-breaker (e.g. `id`), so rows sharing an identical timestamp could order inconsistently across page loads. Verified this is not new: `list-leads.ts` (the exact precedent this diff mirrors, already shipped in Epic 2) has the identical gap. Not caused by this story — pre-existing pattern shared with its mirror.
- **false**: Edge Case Hunter flagged `has_file: row.file_object_path != null` as vulnerable to an empty-string `file_object_path` reporting `true` incorrectly. Disproved: `createContract` (`create-contract.ts`, Story 1) — the only writer of this column — sets it to either `null` or a freshly generated non-empty `${uuid}.bin`, never `""`. No path in this codebase produces an empty string here.
- **low — reject**: `admin_users.select("user_id, name")` column name unverified. Checked `database.types.ts:17-22` — `AdminUsersRow.name: string | null` exists exactly as selected. Not a real gap.
- **reject (out of scope)**: no Server Action/route wires `listContracts` with `requireSuperAdmin` at a call site yet. Matches the Intent block exactly ("Backend-only scope; the listing page/table UI is Codex's") and the same bare-DAL-function shape already shipped for `getFinancialBalance`/`getFinancialCharts` (Stories 5.3/5.4) — not a gap this story's intent covers.
- **low — reject**: the main `contracts` query relies on RLS rather than an explicit role check in this function. Verified: `contracts_all_super_admin` (migration `0005_contracts.sql`) already restricts all operations on `contracts` to `super_admin` — the same RLS-as-enforcement-layer pattern `listLeads`'s own doc comment states explicitly for `leads`.
- **low — reject**: both name-resolution helpers silently fall back to `null`/empty-map on error rather than propagating a signal. Matches `resolvePartnerNames`'s established, already-shipped precedent (Story 5.4) exactly — not a new tradeoff introduced here, and the two test-coverage patches above close the actual verification gap without needing a behavior change.
- **low — reject**: `created_by` (raw id) is always returned even when `created_by_name` is `null`. No requirement or I/O matrix row calls for omitting it, and a raw id alongside a null name is a normal, handleable pair for a listing UI (same shape `assigned_to`-style ids appear elsewhere in this codebase without a resolved name guarantee).
