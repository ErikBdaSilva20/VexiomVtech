---
title: 'Story 5.3: Saldo financeiro do período'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `super_admin` has no way to read the period balance (entrada − saída) of `financial_transactions` — default current calendar month, with an optional custom range. Backend-only scope; UI (period selector, balance display) is Codex's.

**Approach:** Add a `src/lib/finance/financial-period-schema.ts` (mirrors `src/lib/leads/prospecting-overview-schema.ts`'s optional `from`/`to` Zod pattern) and `get-financial-balance.ts` (mirrors `get-prospecting-overview.ts`'s DAL shape: resolve the period, query, aggregate in memory). Unlike leads' `created_at timestamptz` (which needs `sao-paulo-time.ts` UTC-offset conversion), `financial_transactions.occurred_at` is a plain Postgres `date` — compare directly against `"YYYY-MM-DD"` strings with `gte`/`lte`, no timezone math needed. Sum `amount` in integer cents (round each value, accumulate as integers, divide by 100 at the end) rather than raw floats, since this is money and `numeric(12,2)` values summed as JS floats can drift by fractions of a cent. No migration needed — table/RLS already exist.

</frozen-after-approval>

## Implementation Notes

- Reused `localDateString` from `src/lib/leads/sao-paulo-time.ts` only for computing "today" in São Paulo local time when defaulting to the current month — no other timezone conversion needed since `occurred_at` is a plain `date` column, unlike leads' `created_at timestamptz`.
- Summed `amount` in integer cents internally (`Math.round(amount * 100)`, accumulate as integer, divide by 100 at the end) to avoid float drift across many rows — a correctness concern specific to money math, tested explicitly with 10× `0.1` summing to exactly `1`.
- Files added: `src/lib/finance/financial-period-schema.ts`, `get-financial-balance.ts` (+ colocated `.test.ts` each). No existing files modified.
- No page/route/action added — this is a read aggregation the future `/painel-8f2k/financeiro` page (Codex) will call directly as a server component data load, same as leads' `getProspectingOverview` is called from its page.
- Verification: `npx eslint src/lib/finance` — clean. `npx tsc --noEmit` — clean. `npx vitest run` — 337/337 passing (40 files), no regressions.

## Review Triage Log

Blind Hunter (context-free subagent) reviewed the diff; 8 findings, all checked against the actual files before acting:

- `resolvePeriod`'s from-only/to-only handling was asymmetric and undocumented vs. `getProspectingOverview`'s convention — a `to`-only query collapsed to a single-day range (`from = to`) instead of a sensible default window — **high** (real, silently wrong period for a plausible query shape). Fixed: unified to resolve `to` first (explicit or today), then default missing `from` to the 1st of `to`'s month; documented the precedence inline; added 2 tests (from-only, to-only).
- No `.range()`/pagination — PostgREST's default row cap would silently truncate the sum for a period with more than ~1000 transactions — **high** (real, money-correctness risk with no warning). Fixed: added a `fetchAllTransactions` pagination loop (1000-row pages) that keeps fetching until a short page is returned; added a test proving a 1001-row period sums correctly across two pages.
- No test for a negative balance (expenses exceeding income) — **low**, fixed: added a test.
- No test for a malformed `to` date at the schema level (only `from` was covered) — **low**, fixed: added a test.
- `.refine`'s inverted-range error always attaches to `path: ["from"]`, not jointly to `to` — **low, rejected**: matches the established `prospecting-overview-schema.ts` convention exactly (same single-path pattern); not a regression introduced here, and no UI consumes field-level errors from this schema yet.
- No defensive re-check of `from <= to` inside `getFinancialBalance` itself (relies on callers validating with the schema first) — **low, rejected**: matches `getProspectingOverview`'s same reliance on caller-side validation; the DAL layer intentionally trusts its Zod boundary per this project's established layering, consistent everywhere else in the codebase.
- Docstring didn't call out the from-only/to-only resolution rule — **low**, fixed as part of the `resolvePeriod` fix above (doc comment now states the precedence explicitly).
- Confirmed (not a finding, noted by reviewer): `direction` is a strict `"entrada" | "saida"` union per `database.types.ts`, so treating non-"entrada" as expense in the aggregation loop is type-safe, not a latent bug.
