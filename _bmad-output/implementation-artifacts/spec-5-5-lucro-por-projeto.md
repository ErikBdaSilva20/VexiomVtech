---
title: 'Story 5.5: Lucro por projeto'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `super_admin` has no way to read a single project's profit (sum of entradas minus sum of saídas linked to it, all-time — no period filter per the ACs) — zero when a project has no linked transactions, no error. Backend-only scope; the project detail page display is Codex's.

**Approach:** Add `get-project-profit.ts` querying `financial_transactions` filtered by `project_id` (not by date period — this story has no period concept, unlike 5.3/5.4). Generalize the pagination loop already duplicated across `fetch-transactions-in-period.ts` into a shared `fetchAllPages` helper (`paginate-transactions.ts`) now that there's a second real caller with a different filter shape, rather than copy-pasting the loop a second time. Reuse `toCents`/`fromCents` from `money.ts` (Story 5.4) for the same money-precision discipline.

</frozen-after-approval>

## Implementation Notes

- Generalized the pagination loop into `paginate-transactions.ts`'s `fetchAllPages<T>` (takes a `(start, end) => query` callback), and refactored `fetch-transactions-in-period.ts` to use it — behavior-preserving (same order, same error message, all 3 existing test files for it still pass unmodified in structure).
- `fetchTransactionsForProject` has no date bounds by design (Story 5.5's ACs describe all-time profit, not a windowed one) — orders only by `id` (no `occurred_at` tiebreak needed since there's no date-range boundary to protect against duplication at, just the row-count page boundary itself).
- Files added: `paginate-transactions.ts`, `fetch-transactions-for-project.ts`, `get-project-profit.ts` (+ colocated `.test.ts` each). Files modified: `fetch-transactions-in-period.ts` (refactored to use the shared pagination helper, no behavior change).
- Verification: `npx eslint src/lib/finance` — clean. `npx tsc --noEmit` — clean. `npx vitest run` — 365/365 passing (46 files), no regressions.

## Review Triage Log

Blind Hunter (context-free subagent) reviewed the diff; 7 findings, all checked against the actual files before acting:

- `fetchAllPages`'s doc comment claimed general reuse ("different callers... by period, by project") while hardcoding a finance-specific Portuguese error message — **low**, fixed: reworded the comment to state it's scoped to `financial_transactions` callers specifically, not a general utility, so the hardcoded message stops being a latent surprise for a future non-finance caller.
- No test for a later-page failure after earlier pages' rows were already accumulated — **medium** (real gap in exactly the edge case the review was asked to focus on; unverified whether a partial result could leak instead of throwing). Fixed: added a test with a full first page + failing second page, asserting the error still throws (not a partial return) and both pages were attempted.
- Exact-page-size boundary causes one extra empty-page round trip before terminating — **low, not a bug**: confirmed intentional (unambiguous termination signal vs. tracking a separate count). Fixed: documented the trade-off inline rather than leaving it silently discoverable only by reading the loop condition closely.
- No mixed-direction-within-a-single-page test for `fetchTransactionsForProject` — **low**, fixed: added a test with entrada/saida rows interleaved in one page.
- `getProjectProfit` doesn't verify `projectId` refers to a real project (nonexistent id ≡ real project with zero transactions) — **low, rejected as a bug, documented as an assumption**: matches AC2's own framing ("zero, sem erro") and this codebase's established layering (the page/action loads the project first; a bad id 404s before this is ever reached, same as `getFinancialCharts` trusting its caller for the role check). Added a doc comment stating this explicitly so it reads as a decision, not an oversight.
- `getProjectProfit`/`fetchTransactionsForProject` have no caller wired up yet — **not a finding, by design**: same as `getFinancialBalance` (5.3) and `getFinancialCharts` (5.4), this entire epic is backend-only per the user's explicit scope; wiring is Codex's.
- Comment explaining "why paginate at all" was relocated into `paginate-transactions.ts` during the extraction, leaving no pointer in `fetch-transactions-in-period.ts` — **low**, fixed: added a one-line pointer comment.
