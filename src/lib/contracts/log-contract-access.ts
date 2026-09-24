import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

/**
 * Inserts one `contract_access_log` row for a successful decrypted
 * download. Per the spec, an insert failure here is fail-open — the caller
 * (the download route) must still serve the already-decrypted PDF and only
 * log the logging failure itself server-side; this function surfaces the
 * failure by throwing so the caller can't accidentally treat it as success.
 */
export async function logContractAccess(
  supabase: SupabaseClient<Database>,
  contractId: string,
  adminId: string
): Promise<void> {
  const { error } = await supabase
    .from("contract_access_log")
    .insert({ contract_id: contractId, admin_id: adminId })

  if (error) {
    throw error
  }
}
