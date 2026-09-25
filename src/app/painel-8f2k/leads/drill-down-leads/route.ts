import { NextResponse } from "next/server"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { listLeads } from "@/lib/leads/list-leads"
import { listLeadsQuerySchema } from "@/lib/leads/list-leads-schema"
import { createClient } from "@/lib/supabase/server"

/**
 * Backs `useLeadDrilldown` (client-side fetch triggered from
 * `LeadOverview`'s Funil/Tipos/Volume mensal panels). Returns the same
 * shape `listLeads` produces for a single slice — status, project_type, or
 * a created_at date range (month) — reusing the existing query builder, no
 * new aggregation/query logic.
 */
export async function GET(request: Request) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parsed = listLeadsQuerySchema.safeParse({
    status: searchParams.get("status") ?? undefined,
    project_type: searchParams.get("project_type") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
    page_size: searchParams.get("page_size") ?? 100,
  })

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros inválidos." }, { status: 400 })
  }

  try {
    const supabase = await createClient()
    const result = await listLeads(supabase, parsed.data)
    return NextResponse.json(result)
  } catch (error) {
    console.error("GET /painel-8f2k/leads/drill-down-leads: failed to load leads", error)
    return NextResponse.json({ error: "Não foi possível carregar os leads." }, { status: 500 })
  }
}
