---
title: 'Story 5.2: Registro de lançamentos financeiros'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `super_admin` has no way to write to `financial_transactions` (direction, category, amount, date, description, optional project/partner links) — the table, its RLS, and DB types already exist (base schema), but there is no domain/server-action layer to write to it. Backend-only scope; UI is Codex's (its `financial-entry-form.tsx`/`novo/page.tsx` are already a disabled preview stub, confirming field names: `direction`, `amount`, `category`, `occurred_at`, `description`, `project_id`, `partner_id`).

**Approach:** Mirror the `src/lib/projects/` domain-layer pattern established in Story 5.1 (Zod schema, `create-transaction.ts`, `write-transaction-error.ts`, colocated tests) plus a `src/app/painel-8f2k/financeiro/actions.ts` Server Actions file with the same `requireSuperAdmin` guard as `projetos/actions.ts`/`cases/actions.ts`. This story is create-only (no edit/delete ACs) — a financial ledger entry, once saved, isn't specced to be editable. No migration needed — `financial_transactions` table/RLS/types already ship in `supabase/migrations/0001_initial_schema.sql` and `src/lib/supabase/database.types.ts`. `amount` gets a DB-level `> 0` check already; Zod must still validate it client-request-side per NFR4, and `created_by` must be set server-side from the authenticated admin, never trusted from client input.

</frozen-after-approval>

## Implementation Notes

- Confirmed `financial_transactions` table, its `financial_transactions_all_super_admin` RLS policy, and `FinancialTransactionsRow`/`Insert`/`Update`/`TransactionDirection` types already exist (`supabase/migrations/0001_initial_schema.sql`, `src/lib/supabase/database.types.ts`) — no migration added.
- Confirmed field names against Codex's existing (disabled-preview) `src/components/finance/financial-entry-form.tsx`: `direction`, `amount`, `category`, `occurred_at`, `description`, `project_id`, `partner_id` — all match this story's schema.
- `created_by` is deliberately excluded from the Zod schema and instead passed as an explicit third argument (`createTransaction(supabase, input, createdBy)`), sourced from `getCurrentAdmin()` in the action — never trusted from client `FormData`, so a caller cannot attribute a transaction to a different admin.
- Story scope is create-only (Story 5.2's ACs describe registering a transaction, not editing/deleting one) — no `update-transaction.ts` added.
- Files added: `src/lib/finance/transaction-schema.ts`, `write-transaction-error.ts`, `create-transaction.ts` (+ colocated `.test.ts` each), `src/app/painel-8f2k/financeiro/actions.ts` (+ `.test.ts`). No existing files modified.
- Verification: `npx eslint src/lib/finance src/app/painel-8f2k/financeiro` — clean. `npx tsc --noEmit` — clean. `npx vitest run` — 311/311 passing (38 files), no regressions.
- This story is create-only by design (no update/delete ACs); no double-submit/idempotency guard was added — acceptable for an internal 2-person admin tool, revisit only if it becomes a real support burden.

## Review Triage Log

Blind Hunter (context-free subagent) reviewed the diff; 9 findings, all checked against the actual files before acting:

- `amount` accepted more than 2 decimal places, which Postgres `numeric(12,2)` would silently round on insert — **high** (real, silently persists a different value than validated/shown). Fixed: switched `amount` to string-regex validation (`^\d+(\.\d{1,2})?$`) before coercing to number, avoiding float-multiplication edge cases; added 2 tests (rejects 3 decimals, accepts a bare integer).
- No test at the exact `numeric(12,2)` ceiling (`9999999999.99` should pass, one cent over should fail) — **low**, fixed: added both boundary tests.
- No test for an out-of-range calendar date (`2026-02-30`) — **low**, fixed: verified `z.iso.date()` already rejects it, added a test documenting that guarantee.
- No test for a whitespace-only `category`/`description` — **low**, fixed: added both tests (already correctly rejected by `.trim().min(1)`, now proven).
- `requireSuperAdmin`/`textFormValue` duplicated a 3rd time (`cases`, `projetos`, `financeiro`) — **medium** (real, established anti-vibe-coding "existing bad pattern" trigger at 3 copies). Fixed: extracted `src/lib/auth/require-super-admin.ts` and `src/lib/forms/text-form-value.ts`, updated all three `actions.ts` files to use them. Full suite re-run after the extraction (319/319 passing) to confirm no regression in the two prior stories' actions.
- `invalid_reference` message doesn't distinguish `project_id` from `partner_id` — **low**, fixed: added a code comment explaining this is intentional (Postgres FK violations don't identify the failing column without brittle detail-string parsing).
- No end-to-end test proving a spoofed `created_by` in `FormData` never reaches `createTransaction` — **low**, fixed: added one test to `actions.test.ts`.
- Locale: `amount` only accepts `.`-decimal strings, not Brazilian `,`-decimal — **false**: verified `financial-entry-form.tsx` uses `<input type="number">`, which the HTML spec always serializes with `.` regardless of browser locale; not a real gap.
- `classifyWriteTransactionError` untested for not-null-violation/unique-violation codes and the `!data`-with-no-error branch — **low, rejected**: verified `write-case-error.ts`/`create-case.test.ts` (the established convention) has the same scope (only codes the domain gives a specific message for); consistent with existing pattern, not a regression.
- No idempotency/double-submit guard on the create action — **low, rejected**: no AC requires it; internal 2-person tool, acceptable risk. Noted as a deliberate non-goal in Implementation Notes per the reviewer's suggestion.
