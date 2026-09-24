import type { FinancialPeriodQuery } from "@/lib/finance/financial-period-schema"
import { localDateString } from "@/lib/leads/sao-paulo-time"

/**
 * `from`/`to` are America/Sao_Paulo calendar dates, matching the business
 * timezone convention (`sao-paulo-time.ts`) — only `localDateString(now)` is
 * needed here (not the timestamptz range helpers leads uses) because
 * `financial_transactions.occurred_at` is already a plain Postgres `date`.
 *
 * `to` resolves first (explicit value, else today); `from` resolves against
 * that already-resolved `to` when missing, defaulting to the 1st of its
 * month — so a `to`-only query gets "month-to-date up to `to`", not a
 * single-day range, and mirrors `getProspectingOverview`'s precedence of
 * "explicit `from` wins outright, otherwise derive a default window".
 *
 * Shared by `get-financial-balance.ts` and `get-financial-charts.ts`.
 */
export function resolveFinancialPeriod(query: FinancialPeriodQuery): { from: string; to: string } {
  const to = query.to ?? localDateString(new Date())
  if (query.from) {
    return { from: query.from, to }
  }

  const [year, month] = to.split("-")
  return { from: `${year}-${month}-01`, to }
}
