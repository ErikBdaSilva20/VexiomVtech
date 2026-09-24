---
title: 'Story 5.4: Gráficos do dashboard financeiro'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `super_admin` has no aggregated data to power the three financial dashboard charts (FR38/39/40): income vs. expense by month, expense by category, and contribution by partner. Backend-only scope — chart rendering/styling (and the `dataviz` skill consultation NFR8 requires for that) is Codex's; this story only produces the data shape.

**Approach:** Extract the pagination logic already in `get-financial-balance.ts`'s `fetchAllTransactions` into a shared `src/lib/finance/fetch-transactions-in-period.ts` (now used by both balance and charts — a real second use case, not speculative), and a shared `resolve-financial-period.ts` (the same `resolvePeriod` function, currently private to `get-financial-balance.ts`). Add `get-financial-charts.ts` aggregating one paginated fetch into all three shapes in a single pass (in-memory `Map`-based grouping, integer-cents sums, same money-precision discipline as Story 5.3).

**Security-relevant decision, called out explicitly:** the "contribution by partner" chart needs to show partner *names*, but `admin_users` RLS only lets a user read their own row (`auth.uid() = user_id`) — not even `super_admin` can read another admin's row under RLS. Rather than widen that policy, this story resolves partner names via the existing `createAdminClient()` service-role client (`src/lib/supabase/admin.ts`, already used for the public leads insert path), scoped to only the specific `partner_id`s that actually appear in the period's transactions (an `IN()` lookup, not a full-table read). This function is server-only and must only ever be called from a path that has already verified `super_admin` (same as every other finance function) — it does not itself check the caller's role, since RLS-bypassing code re-checking authorization would be redundant with (and no safer than) the caller's existing `requireSuperAdmin`/page-level gate, and duplicating that check here would just be a second place for the real one to be forgotten.

</frozen-after-approval>

## Implementation Notes

- Extracted `fetch-transactions-in-period.ts` and `resolve-financial-period.ts` out of `get-financial-balance.ts` (Story 5.3) — now genuinely shared by both balance and charts, not speculative. `get-financial-balance.ts` was refactored to use both; its error message on query failure changed from "Não foi possível carregar o saldo financeiro." to the shared "Não foi possível carregar os lançamentos financeiros." (test updated accordingly). Full suite re-run to confirm no regression.
- Partner name resolution for the "contribution by partner" chart uses `createAdminClient()` (service-role, bypasses RLS) because `admin_users` RLS only permits reading one's own row — confirmed by reading the RLS policy in `supabase/migrations/0001_initial_schema.sql` and finding no existing code anywhere in the app that reads another admin's row (the `financial-entry-form.tsx` stub even has a comment noting other partners aren't selectable yet for this exact reason). Scoped to only the partner ids present in the period (`IN()` lookup), and fails soft (logs, returns `null` names) rather than failing the whole chart if that lookup errors.
- `getFinancialCharts`/`resolvePartnerNames` do not check the caller's role themselves — same as every other function in this module, authorization is the caller's job (Server Action/page `requireSuperAdmin`/`getCurrentAdmin` gate), consistent with this codebase's layering everywhere else.
- Files added: `src/lib/finance/fetch-transactions-in-period.ts`, `resolve-financial-period.ts`, `get-financial-charts.ts` (+ colocated `.test.ts` each). Files modified: `get-financial-balance.ts` (refactored to use the extracted helpers), `get-financial-balance.test.ts` (period-resolution tests moved to `resolve-financial-period.test.ts`; one error-message assertion updated).
- Verification: `npx eslint src/lib/finance` — clean. `npx tsc --noEmit` — clean. `npx vitest run` — 350/350 passing (43 files), no regressions.

## Review Triage Log

Blind Hunter (context-free subagent) reviewed the diff; 6 findings, all checked against the actual files before acting:

- `fetchTransactionsInPeriod` paginated with `.range()` but no `.order()` — Postgres/PostgREST don't guarantee stable row order across separate `.range()` calls without one, so rows could be duplicated or skipped across page boundaries — **high** (real, silently corrupts every sum built on this fetch). Fixed: added `.order("occurred_at").order("id")` (id as a stable tiebreaker for same-day rows); added a test asserting both order calls; updated all 3 test files' mock chains to match the new query shape.
- `contributionByPartner` sums both directions per partner rather than netting entrada − saida, and the reviewer flagged this as a possible correctness bug (a `saida` "increases" a chart titled "contribution") — investigated against doc 08's own language ("total financiado por cada sócio... dinheiro pessoal investido", not "saldo"): a `saida` tagged with `partner_id` means the partner personally covered that cost, which is just as much "financiado by them" as a deposit. **Judgment call, not a bug — kept the sum, but made it explicit**: added a doc comment on `getFinancialCharts` explaining the reasoning, and renamed the test to state the intent directly so a future reader doesn't have to re-derive it. Flagging this decision explicitly to the user below since it's a business-semantics call, not a pure correctness fix.
- `incomeExpenseByMonth` silently omitted months with zero activity, producing chart gaps instead of true zero points — **medium** (real, would visually mislead a month-over-month chart). Fixed: added `monthsBetween()` to pre-seed every month in `[from, to]` with `{income: 0, expense: 0}` before aggregating; added a test with a gap month and one for an entirely empty period.
- `resolvePartnerNames`'s RLS-bypassing service-role call only had a *documented* assumption that the caller already checked `super_admin` — with zero actual callers wired up yet, nothing enforced it, so a future implementer copying the "DAL doesn't check auth" pattern (correct for every RLS-scoped function, wrong for this one RLS-*bypassing* one) could leak admin names — **high** (real security gap, specific to this function). Fixed: `getFinancialCharts` now takes the caller's `CurrentAdmin` as a required parameter and only calls `resolvePartnerNames` when `admin.role === "super_admin"`, so the RLS-bypass path has its own defense-in-depth check baked into the function itself, not just a comment. Added a test proving a non-`super_admin` caller never reaches the admin client even when partner rows are present.
- `Math.round(amount * 100)` cents conversion was duplicated verbatim in `get-financial-balance.ts` and `get-financial-charts.ts` — **low** (real, worth consolidating given the stated money-precision discipline). Fixed: extracted `toCents`/`fromCents` into `src/lib/finance/money.ts`, used by both.
- No test for a negative or zero `amount` — **low, rejected**: `financial_transactions.amount` has a DB-level `check (amount > 0)` (confirmed in `supabase/migrations/0001_initial_schema.sql`) plus the Zod `.positive()` check in `transaction-schema.ts` (Story 5.2) — a negative/zero amount cannot reach this table through the application's own write path, so testing for it here would be testing an unreachable state.
