import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { fetchAllPages } from "@/lib/finance/paginate-transactions"
import type { Database } from "@/lib/supabase/database.types"

export type ProjectTransactionRow = {
  direction: "entrada" | "saida"
  amount: number
}

/**
 * All-time (no period filter) — project profit (Story 5.5) sums every
 * transaction ever linked to a project, not a windowed subset.
 */
export function fetchTransactionsForProject(
  supabase: SupabaseClient<Database>,
  projectId: string
): Promise<ProjectTransactionRow[]> {
  return fetchAllPages<ProjectTransactionRow>((start, end) =>
    supabase
      .from("financial_transactions")
      .select("direction, amount")
      .eq("project_id", projectId)
      .order("id", { ascending: true })
      .range(start, end)
  )
}
