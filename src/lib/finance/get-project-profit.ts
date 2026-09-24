import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { fetchTransactionsForProject } from "@/lib/finance/fetch-transactions-for-project"
import { fromCents, toCents } from "@/lib/finance/money"
import type { Database } from "@/lib/supabase/database.types"

export type ProjectProfit = {
  projectId: string
  income: number
  expense: number
  profit: number
}

/**
 * Profit for a single project (FR41/5.5): sum of entradas minus sum of
 * saídas linked to it via `financial_transactions.project_id`, all-time. A
 * project with no linked transactions returns zero on every field, not an
 * error (AC2) — an empty result set from `fetchTransactionsForProject` loops
 * zero times below, which already yields zero without a special case.
 *
 * Does not itself verify `projectId` refers to a real project — a
 * nonexistent id is indistinguishable from a real project with zero
 * transactions (both return all-zero). This mirrors AC2's own framing
 * ("zero, sem erro") and the codebase's convention of the page/action layer
 * loading the project first (so a bad id 404s before this is ever called),
 * not this aggregation re-verifying what its caller already confirmed.
 */
export async function getProjectProfit(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<ProjectProfit> {
  const rows = await fetchTransactionsForProject(supabase, projectId)

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

  return { projectId, income, expense, profit: income - expense }
}
