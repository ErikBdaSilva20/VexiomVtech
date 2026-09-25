import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import { escapeIlikeOrFilterValue } from "@/lib/leads/postgrest-filter"
import { MS_PER_DAY, startOfLocalDay } from "@/lib/leads/sao-paulo-time"
import type { Database } from "@/lib/supabase/database.types"
import type { ListLeadsQuery } from "@/lib/leads/list-leads-schema"

type LeadRow = Database["public"]["Tables"]["leads"]["Row"]

export type ListLeadsResult = {
  leads: LeadRow[]
  total: number
  page: number
  pageSize: number
}

const SEARCH_COLUMNS = ["name", "company", "email", "whatsapp"] as const

/**
 * Lists leads with search + combinable filters (FR8). Read-only DAL for
 * `/painel-8f2k/leads` — RLS (`leads_select_admins`) is the enforcement
 * layer, so this must be called with the session-aware client, never the
 * service-role client.
 */
export async function listLeads(
  supabase: SupabaseClient<Database>,
  filters: ListLeadsQuery
): Promise<ListLeadsResult> {
  const from = (filters.page - 1) * filters.page_size
  const to = from + filters.page_size - 1

  let query = supabase.from("leads").select("*", { count: "exact" })

  if (filters.search) {
    const term = escapeIlikeOrFilterValue(filters.search)
    query = query.or(SEARCH_COLUMNS.map((column) => `${column}.ilike.%${term}%`).join(","))
  }

  if (filters.status) {
    query = query.eq("status", filters.status)
  }

  if (filters.tag) {
    query = query.contains("tags", [filters.tag])
  }

  if (filters.project_type) {
    query = query.eq("project_type", filters.project_type)
  }

  if (filters.assigned_to) {
    query = query.eq("assigned_to", filters.assigned_to)
  }

  if (filters.from) {
    query = query.gte("created_at", startOfLocalDay(filters.from).toISOString())
  }

  if (filters.to) {
    query = query.lt("created_at", new Date(startOfLocalDay(filters.to).getTime() + MS_PER_DAY).toISOString())
  }

  const { data, error, count } = await query
    .order("created_at", { ascending: false })
    .range(from, to)

  if (error) {
    console.error("listLeads: query failed", error)
    throw new Error("Não foi possível carregar os leads.")
  }

  return { leads: data ?? [], total: count ?? 0, page: filters.page, pageSize: filters.page_size }
}
