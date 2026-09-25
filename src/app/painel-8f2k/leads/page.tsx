import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { LeadAlerts, LeadOverview } from "@/components/leads/lead-dashboard"
import { LeadListSection } from "@/components/leads/lead-list-section"
import { LeadSectionSelector, type LeadSection } from "@/components/leads/lead-section-selector"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { getDailyAgendaAlerts, type DailyAgendaAlerts } from "@/lib/leads/get-daily-agenda-alerts"
import { getLeadRiskAlerts, type LeadRiskAlerts } from "@/lib/leads/get-lead-risk-alerts"
import { getProspectingOverview, type ProspectingOverview } from "@/lib/leads/get-prospecting-overview"
import { listLeads, type ListLeadsResult } from "@/lib/leads/list-leads"
import { listLeadsQuerySchema } from "@/lib/leads/list-leads-schema"
import { prospectingOverviewQuerySchema } from "@/lib/leads/prospecting-overview-schema"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Leads — Vexiom",
  robots: { index: false, follow: false },
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function parseSection(value: string | undefined): LeadSection {
  if (value === "alerts" || value === "list") return value
  return "overview"
}

function buildSectionHrefs({
  dashboardDates,
  filters,
}: {
  dashboardDates: { from?: string | null; to?: string | null }
  filters: {
    search?: string
    status?: string
    tag?: string
    project_type?: string
    assigned_to?: string
    page_size: number
  }
}): Record<LeadSection, string> {
  const overview = new URLSearchParams({ section: "overview" })
  if (dashboardDates.from) overview.set("from", dashboardDates.from)
  if (dashboardDates.to) overview.set("to", dashboardDates.to)

  const list = new URLSearchParams({ section: "list" })
  if (filters.search) list.set("search", filters.search)
  if (filters.status) list.set("status", filters.status)
  if (filters.tag) list.set("tag", filters.tag)
  if (filters.project_type) list.set("project_type", filters.project_type)
  if (filters.assigned_to) list.set("assigned_to", filters.assigned_to)
  if (filters.page_size !== 20) list.set("page_size", String(filters.page_size))

  return {
    overview: "/painel-8f2k/leads?" + overview.toString(),
    alerts: "/painel-8f2k/leads?section=alerts",
    list: "/painel-8f2k/leads?" + list.toString(),
  }
}

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")

  const raw = await searchParams
  const section = parseSection(one(raw.section))
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

  let overview: ProspectingOverview | null = null
  let risk: LeadRiskAlerts | null = null
  let agenda: DailyAgendaAlerts | null = null
  let result: ListLeadsResult | undefined
  let listFailed = false

  const supabase = await createClient()

  if (section === "overview") {
    try {
      overview = await getProspectingOverview(supabase, dashboardQuery)
    } catch {
      overview = null
    }
  }

  if (section === "alerts") {
    const [riskOutcome, agendaOutcome] = await Promise.allSettled([
      getLeadRiskAlerts(supabase),
      getDailyAgendaAlerts(supabase),
    ])
    risk = riskOutcome.status === "fulfilled" ? riskOutcome.value : null
    agenda = agendaOutcome.status === "fulfilled" ? agendaOutcome.value : null
  }

  if (section === "list") {
    try {
      result = await listLeads(supabase, filters)
    } catch {
      listFailed = true
    }
  }

  const sectionHrefs = buildSectionHrefs({
    dashboardDates: {
      from: overview?.from ?? dashboardQuery.from,
      to: overview?.to ?? dashboardQuery.to,
    },
    filters,
  })

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

        <LeadSectionSelector key={section} section={section} hrefs={sectionHrefs} />

        {section === "overview" && (
          <LeadOverview
            overview={overview}
            selectedDates={{ from: dashboardQuery.from ?? undefined, to: dashboardQuery.to ?? undefined }}
            invalidPeriod={!parsedDashboard.success}
            adminId={admin.id}
          />
        )}

        {section === "alerts" && <LeadAlerts risk={risk} agenda={agenda} />}

        {section === "list" && (
          <LeadListSection
            result={result}
            failed={listFailed}
            filters={filters}
            adminId={admin.id}
          />
        )}
      </div>
    </main>
  )
}
