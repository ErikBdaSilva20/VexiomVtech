import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

type ContractRow = Database["public"]["Tables"]["contracts"]["Row"]

// Supabase's "no rows found" error code for `.single()` — expected when the
// `id` doesn't match any row, not a real failure (mirrors
// `get-current-admin.ts`'s `NO_ROWS_ERROR_CODE` handling).
const NO_ROWS_ERROR_CODE = "PGRST116"

/**
 * Single-row lookup by id for the download route. Returns `null` on
 * not-found rather than throwing — the route turns that into a 404, same as
 * any other "doesn't exist" case, not an unexpected-error 500.
 */
export async function fetchContract(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<ContractRow | null> {
  const { data, error } = await supabase.from("contracts").select("*").eq("id", id).single()

  if (error) {
    if (error.code !== NO_ROWS_ERROR_CODE) {
      console.error("fetchContract: failed to look up contract", id, error)
    }
    return null
  }

  return data
}
