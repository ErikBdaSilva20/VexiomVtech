import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

export type PeriodTransactionRow = {
  direction: "entrada" | "saida"
  amount: number
  occurred_at: string
  category: string
  partner_id: string | null
}

const PAGE_SIZE = 1000

/**
 * PostgREST caps unbounded selects at a default row limit (commonly 1000) —
 * fetches every matching row in `PAGE_SIZE` pages rather than trusting a
 * single request to return everything, since a truncated result would
 * silently skew every aggregation built on top of it (balance, charts).
 *
 * Shared by `get-financial-balance.ts` and `get-financial-charts.ts` — both
 * need the same period-filtered row set, just aggregated differently.
 */
export async function fetchTransactionsInPeriod(
  supabase: SupabaseClient<Database>,
  from: string,
  to: string
): Promise<PeriodTransactionRow[]> {
  const rows: PeriodTransactionRow[] = []
  let page = 0

  for (;;) {
    const start = page * PAGE_SIZE
    const { data, error } = await supabase
      .from("financial_transactions")
      .select("direction, amount, occurred_at, category, partner_id")
      .gte("occurred_at", from)
      .lte("occurred_at", to)
      // Postgres/PostgREST don't guarantee stable row order across separate
      // `.range()` requests without an explicit `order` — without this, rows
      // could be duplicated or skipped across page boundaries, silently
      // corrupting the sums built on top of this fetch. `id` is the primary
      // key, so it's a stable tiebreaker even for same-day transactions.
      .order("occurred_at", { ascending: true })
      .order("id", { ascending: true })
      .range(start, start + PAGE_SIZE - 1)

    if (error) {
      console.error("fetchTransactionsInPeriod: failed to load transactions", error)
      throw new Error("Não foi possível carregar os lançamentos financeiros.")
    }

    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
    page += 1
  }

  return rows
}
