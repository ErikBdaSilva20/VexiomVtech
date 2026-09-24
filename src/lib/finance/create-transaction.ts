import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { CreateTransactionInput } from "@/lib/finance/transaction-schema"
import { classifyWriteTransactionError, type WriteTransactionErrorKind } from "@/lib/finance/write-transaction-error"
import type { Database } from "@/lib/supabase/database.types"

export type CreateTransactionResult = { ok: true; id: string } | { ok: false; error: WriteTransactionErrorKind }

/**
 * Records a single cash-book entry (FR35/5.2) — `created_by` is always the
 * caller's own admin id, passed in explicitly rather than read from `input`,
 * so this function has no way to attribute a transaction to someone else.
 */
export async function createTransaction(
  supabase: SupabaseClient<Database>,
  input: CreateTransactionInput,
  createdBy: string
): Promise<CreateTransactionResult> {
  const { data, error } = await supabase
    .from("financial_transactions")
    .insert({ ...input, created_by: createdBy })
    .select("id")
    .single()

  if (error || !data) {
    console.error("createTransaction: failed to insert transaction", error)
    return { ok: false, error: classifyWriteTransactionError(error) }
  }

  return { ok: true, id: data.id }
}
