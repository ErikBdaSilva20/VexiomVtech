import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { FinancialPeriodQuery } from "@/lib/finance/financial-period-schema"
import { localDateString } from "@/lib/leads/sao-paulo-time"
import type { Database } from "@/lib/supabase/database.types"

export type FinancialBalance = {
  from: string
  to: string
  income: number
  expense: number
  balance: number
}

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
 */
function resolvePeriod(query: FinancialPeriodQuery): { from: string; to: string } {
  const to = query.to ?? localDateString(new Date())
  if (query.from) {
    return { from: query.from, to }
  }

  const [year, month] = to.split("-")
  return { from: `${year}-${month}-01`, to }
}

const PAGE_SIZE = 1000

/**
 * PostgREST caps unbounded selects at a default row limit (commonly 1000) —
 * fetches every matching row in `PAGE_SIZE` pages rather than trusting a
 * single request to return everything, since a truncated result here would
 * silently understate the balance instead of erroring.
 */
async function fetchAllTransactions(
  supabase: SupabaseClient<Database>,
  from: string,
  to: string
): Promise<{ direction: "entrada" | "saida"; amount: number }[]> {
  const rows: { direction: "entrada" | "saida"; amount: number }[] = []
  let page = 0

  for (;;) {
    const start = page * PAGE_SIZE
    const { data, error } = await supabase
      .from("financial_transactions")
      .select("direction, amount")
      .gte("occurred_at", from)
      .lte("occurred_at", to)
      .range(start, start + PAGE_SIZE - 1)

    if (error) {
      console.error("getFinancialBalance: failed to load transactions", error)
      throw new Error("Não foi possível carregar o saldo financeiro.")
    }

    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
    page += 1
  }

  return rows
}

/**
 * Aggregates the cash-book balance for a period (FR37): income minus
 * expense. Sums in integer cents rather than raw floats — `amount` is
 * `numeric(12,2)`, and summing JS floats directly can drift by fractions of
 * a cent across many rows, which is unacceptable for money.
 */
export async function getFinancialBalance(
  supabase: SupabaseClient<Database>,
  query: FinancialPeriodQuery
): Promise<FinancialBalance> {
  const { from, to } = resolvePeriod(query)
  const rows = await fetchAllTransactions(supabase, from, to)

  let incomeCents = 0
  let expenseCents = 0

  for (const row of rows) {
    const cents = Math.round(row.amount * 100)
    if (row.direction === "entrada") {
      incomeCents += cents
    } else {
      expenseCents += cents
    }
  }

  const income = incomeCents / 100
  const expense = expenseCents / 100

  return { from, to, income, expense, balance: income - expense }
}
