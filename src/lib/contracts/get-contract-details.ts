import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/database.types"

type Contract = Database["public"]["Tables"]["contracts"]["Row"]
type Lead = Database["public"]["Tables"]["leads"]["Row"]
type AccessLog = Database["public"]["Tables"]["contract_access_log"]["Row"]

export type ContractAccess = AccessLog & { admin_name: string | null }

export type ContractDetails = {
  contract: Contract
  lead: Lead | null
  creator_name: string | null
  accesses: ContractAccess[]
}

/** Loads contract metadata plus the related lead context for the detail view. */
export async function getContractDetails(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<ContractDetails | null> {
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (contractError) {
    console.error("getContractDetails: failed to load contract", id, contractError)
    return null
  }
  if (!contract) return null

  const [{ data: lead, error: leadError }, { data: accessRows, error: accessError }] = await Promise.all([
    supabase.from("leads").select("*").eq("id", contract.lead_id).maybeSingle(),
    supabase
      .from("contract_access_log")
      .select("*")
      .eq("contract_id", contract.id)
      .order("accessed_at", { ascending: false }),
  ])

  if (leadError) console.error("getContractDetails: failed to load lead", contract.lead_id, leadError)
  if (accessError) console.error("getContractDetails: failed to load access log", contract.id, accessError)

  const accesses = accessRows ?? []
  const adminIds = [...new Set([contract.created_by, ...accesses.map((access) => access.admin_id)])]
  const adminNames = new Map<string, string | null>()

  if (adminIds.length > 0) {
    const { data: admins, error: adminsError } = await createAdminClient()
      .from("admin_users")
      .select("user_id,name")
      .in("user_id", adminIds)

    if (adminsError) {
      console.error("getContractDetails: failed to resolve admin names", adminsError)
    } else {
      for (const admin of admins ?? []) adminNames.set(admin.user_id, admin.name)
    }
  }

  return {
    contract,
    lead: lead ?? null,
    creator_name: adminNames.get(contract.created_by) ?? null,
    accesses: accesses.map((access) => ({ ...access, admin_name: adminNames.get(access.admin_id) ?? null })),
  }
}
