import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { fetchAllPages } from "@/lib/finance/paginate-transactions"
import type { Database } from "@/lib/supabase/database.types"

export type PeriodTransactionRow = {
  direction: "entrada" | "saida"
  amount: number
  occurred_at: string
  category: string
  partner_id: string | null
}

/**
 * Paginates via `fetchAllPages` (see its doc comment for why: PostgREST
 * caps unbounded selects at a default row limit). Shared by
 * `get-financial-balance.ts` and `get-financial-charts.ts` — both need the
 * same period-filtered row set, just aggregated differently.
 */
export function fetchTransactionsInPeriod(
  supabase: SupabaseClient<Database>,
  from: string,
  to: string
): Promise<PeriodTransactionRow[]> {
  return fetchAllPages<PeriodTransactionRow>((start, end) =>
    supabase
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
      .range(start, end)
  )
}
