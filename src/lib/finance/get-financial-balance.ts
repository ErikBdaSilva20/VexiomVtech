import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { fetchTransactionsInPeriod } from "@/lib/finance/fetch-transactions-in-period"
import type { FinancialPeriodQuery } from "@/lib/finance/financial-period-schema"
import { fromCents, toCents } from "@/lib/finance/money"
import { resolveFinancialPeriod } from "@/lib/finance/resolve-financial-period"
import type { Database } from "@/lib/supabase/database.types"

export type FinancialBalance = {
  from: string
  to: string
  income: number
  expense: number
  balance: number
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
  const { from, to } = resolveFinancialPeriod(query)
  const rows = await fetchTransactionsInPeriod(supabase, from, to)

  let incomeCents = 0
  let expenseCents = 0

  for (const row of rows) {
    const cents = toCents(row.amount)
    if (row.direction === "entrada") {
      incomeCents += cents
    } else {
      expenseCents += cents
    }
  }

  const income = fromCents(incomeCents)
  const expense = fromCents(expenseCents)

  return { from, to, income, expense, balance: income - expense }
}
