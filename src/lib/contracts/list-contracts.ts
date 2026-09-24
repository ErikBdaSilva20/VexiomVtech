import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { CurrentAdmin } from "@/lib/auth/get-current-admin"
import type { ListContractsQuery } from "@/lib/contracts/list-contracts-schema"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/database.types"

export type ContractListItem = {
  id: string
  lead_id: string
  lead_name: string | null
  service_types: string[]
  amount: number
  hours: number | null
  has_file: boolean
  created_by: string
  created_by_name: string | null
  created_at: string
}

export type ListContractsResult = {
  contracts: ContractListItem[]
  total: number
  page: number
  pageSize: number
}

/**
 * Resolves display names for the admins who created the contracts on this
 * page. Uses the same service-role escape hatch as `getFinancialCharts`'s
 * `resolvePartnerNames` — an `admin_users` read for any user other than the
 * caller requires the service-role client, since `admin_users` RLS is
 * self-row-only even for `super_admin`. Unlike `resolvePartnerNames` (which
 * takes no role and relies entirely on its caller to gate it), this function
 * self-gates on `admin.role` internally: a non-`super_admin` `admin` never
 * triggers this query at all, and every row's creator name resolves to
 * `null`. Don't copy `resolvePartnerNames`'s shape assuming it also
 * self-gates — it doesn't.
 */
async function resolveCreatorNames(
  admin: CurrentAdmin,
  createdByIds: string[]
): Promise<Map<string, string | null>> {
  if (admin.role !== "super_admin" || createdByIds.length === 0) return new Map()

  const { data, error } = await createAdminClient()
    .from("admin_users")
    .select("user_id, name")
    .in("user_id", createdByIds)

  if (error) {
    console.error("listContracts: failed to resolve creator names", error)
    return new Map()
  }

  return new Map((data ?? []).map((row) => [row.user_id, row.name]))
}

/**
 * Lists registered contracts (Story 3), paginated and ordered newest-first.
 * Read-only DAL restricted to `super_admin` — the caller (a Server Action)
 * must `requireSuperAdmin` before invoking this, but this function also
 * re-checks `admin.role` before ever touching `admin_users`, same
 * defense-in-depth shape as `getFinancialCharts`.
 *
 * The raw `file_object_path` is never included in the returned shape — only
 * a derived `has_file` boolean.
 */
export async function listContracts(
  supabase: SupabaseClient<Database>,
  admin: CurrentAdmin,
  query: ListContractsQuery
): Promise<ListContractsResult> {
  const from = (query.page - 1) * query.page_size
  const to = from + query.page_size - 1

  const { data, error, count } = await supabase
    .from("contracts")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    console.error("listContracts: query failed", error)
    throw new Error("Não foi possível carregar os contratos.")
  }

  const rows = data ?? []

  const leadIds = [...new Set(rows.map((row) => row.lead_id))]
  const creatorIds = [...new Set(rows.map((row) => row.created_by))]

  const [leadNames, creatorNames] = await Promise.all([
    (async () => {
      if (leadIds.length === 0) return new Map<string, string | null>()

      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id, name")
        .in("id", leadIds)

      if (leadsError) {
        console.error("listContracts: failed to resolve lead names", leadsError)
        return new Map<string, string | null>()
      }

      return new Map((leads ?? []).map((lead) => [lead.id, lead.name]))
    })(),
    resolveCreatorNames(admin, creatorIds),
  ])

  const contracts: ContractListItem[] = rows.map((row) => ({
    id: row.id,
    lead_id: row.lead_id,
    lead_name: leadNames.get(row.lead_id) ?? null,
    service_types: row.service_types,
    amount: row.amount,
    hours: row.hours,
    has_file: row.file_object_path != null,
    created_by: row.created_by,
    created_by_name: creatorNames.get(row.created_by) ?? null,
    created_at: row.created_at,
  }))

  return { contracts, total: count ?? 0, page: query.page, pageSize: query.page_size }
}
