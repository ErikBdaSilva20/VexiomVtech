import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { LeadOverviewAndAlerts } from "@/components/leads/lead-dashboard"
import { LeadListSection } from "@/components/leads/lead-list-section"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { getDailyAgendaAlerts, type DailyAgendaAlerts } from "@/lib/leads/get-daily-agenda-alerts"
import { getLeadRiskAlerts, type LeadRiskAlerts } from "@/lib/leads/get-lead-risk-alerts"
import { getProspectingOverview, type ProspectingOverview } from "@/lib/leads/get-prospecting-overview"
import { listLeads, type ListLeadsResult } from "@/lib/leads/list-leads"
import { listLeadsQuerySchema } from "@/lib/leads/list-leads-schema"
import { prospectingOverviewQuerySchema } from "@/lib/leads/prospecting-overview-schema"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Leads - Vexiom",
  robots: { index: false, follow: false },
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")

  const raw = await searchParams
  const parsedDashboard = prospectingOverviewQuerySchema.safeParse({
    from: one(raw.from) || undefined,
    to: one(raw.to) || undefined,
  })
  const dashboardQuery = parsedDashboard.success
    ? parsedDashboard.data
    : prospectingOverviewQuerySchema.parse({})
  const parsedList = listLeadsQuerySchema.safeParse({
    search: one(raw.search),
    status: one(raw.status),
    tag: one(raw.tag),
    project_type: one(raw.project_type),
    assigned_to: one(raw.assigned_to),
    page: one(raw.page),
    page_size: one(raw.page_size),
  })
  const filters = parsedList.success ? parsedList.data : listLeadsQuerySchema.parse({})

  const supabase = await createClient()

  // All three data sources are fetched together, every load — no section
  // gating anymore, and each is independently try/caught (mirroring
  // `/painel-8f2k`'s per-section isolation) so one failing source doesn't
  // take the other two down with it.
  const [overviewOutcome, riskOutcome, agendaOutcome, listOutcome] = await Promise.allSettled([
    getProspectingOverview(supabase, dashboardQuery),
    getLeadRiskAlerts(supabase),
    getDailyAgendaAlerts(supabase),
    listLeads(supabase, filters),
  ])

  const overview: ProspectingOverview | null = overviewOutcome.status === "fulfilled" ? overviewOutcome.value : null
  const risk: LeadRiskAlerts | null = riskOutcome.status === "fulfilled" ? riskOutcome.value : null
  const agenda: DailyAgendaAlerts | null = agendaOutcome.status === "fulfilled" ? agendaOutcome.value : null
  const result: ListLeadsResult | undefined = listOutcome.status === "fulfilled" ? listOutcome.value : undefined
  const listFailed = listOutcome.status === "rejected"

  return (
    <main className="min-h-screen bg-[#0c0e0c] px-4 py-6 text-[#f3f5f1] sm:px-8 sm:py-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="leads" />

        <header className="mb-7 flex flex-col gap-5 border-b border-[#282d27] pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Gestão comercial</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Leads</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aeb5ab]">
              Organize oportunidades, prioridades e próximos contatos em espaços separados.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-[#9fa69c]">
              Olá, <span className="font-medium text-[#e7ebe4]">{admin.name ?? "equipe"}</span>
            </p>
            <Link
              href="/painel-8f2k/leads/novo"
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#fbd020] px-5 text-sm font-semibold text-[#17140a] transition hover:bg-[#ffe15b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]"
            >
              <span aria-hidden="true" className="mr-2 text-lg leading-none">+</span>
              Novo lead
            </Link>
          </div>
        </header>

        <div className="space-y-10">
          <LeadOverviewAndAlerts
            overview={overview}
            selectedDates={{ from: dashboardQuery.from ?? undefined, to: dashboardQuery.to ?? undefined }}
            invalidPeriod={!parsedDashboard.success}
            adminId={admin.id}
            risk={risk}
            agenda={agenda}
            now={new Date().toISOString()}
          />

          <LeadListSection
            result={result}
            failed={listFailed}
            filters={filters}
            adminId={admin.id}
          />
        </div>
      </div>
    </main>
  )
}
