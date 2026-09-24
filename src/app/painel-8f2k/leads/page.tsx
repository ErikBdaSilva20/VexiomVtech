import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { Form, FormField, FormInput, FormSelect } from "@/components/forms/form"
import { LeadDashboard } from "@/components/leads/lead-dashboard"
import { LEAD_STATUS_LABELS, LEAD_STATUS_OPTIONS } from "@/components/leads/lead-status-labels"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { getDailyAgendaAlerts } from "@/lib/leads/get-daily-agenda-alerts"
import { getLeadRiskAlerts } from "@/lib/leads/get-lead-risk-alerts"
import { getProspectingOverview } from "@/lib/leads/get-prospecting-overview"
import { listLeads } from "@/lib/leads/list-leads"
import { listLeadsQuerySchema } from "@/lib/leads/list-leads-schema"
import { prospectingOverviewQuerySchema } from "@/lib/leads/prospecting-overview-schema"
import { createClient } from "@/lib/supabase/server"


function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}
function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}
function pageHref(page: number, filters: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value)
  params.set("page", String(page))
  return "/painel-8f2k/leads?" + params.toString()
}
function statusStyle(status: string) {
  if (status === "contrato_fechado") return "border-emerald-800 bg-emerald-950/60 text-emerald-300"
  if (status === "nao_convertido") return "border-[#484946] bg-[#242522] text-[#aaa]"
  if (status === "follow_up_pendente") return "border-amber-800 bg-amber-950/50 text-amber-200"
  return "border-[#57513a] bg-[#29271e] text-[#fbd020]"
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
  const dashboardQuery = parsedDashboard.success ? parsedDashboard.data : prospectingOverviewQuerySchema.parse({})
  const parsed = listLeadsQuerySchema.safeParse({
    search: one(raw.search), status: one(raw.status), tag: one(raw.tag),
    project_type: one(raw.project_type), assigned_to: one(raw.assigned_to),
    page: one(raw.page), page_size: one(raw.page_size),
  })
  const filters = parsed.success ? parsed.data : listLeadsQuerySchema.parse({})
  const supabase = await createClient()
  const [leadsOutcome, overviewOutcome, riskOutcome, agendaOutcome] = await Promise.allSettled([
    listLeads(supabase, filters),
    getProspectingOverview(supabase, dashboardQuery),
    getLeadRiskAlerts(supabase),
    getDailyAgendaAlerts(supabase),
  ])
  const result = leadsOutcome.status === "fulfilled" ? leadsOutcome.value : undefined
  const failed = leadsOutcome.status === "rejected"
  const overview = overviewOutcome.status === "fulfilled" ? overviewOutcome.value : null
  const risk = riskOutcome.status === "fulfilled" ? riskOutcome.value : null
  const agenda = agendaOutcome.status === "fulfilled" ? agendaOutcome.value : null

  const currentFilters = {
    search: filters.search, status: filters.status, tag: filters.tag,
    from: overview?.from ?? dashboardQuery.from ?? undefined,
    to: overview?.to ?? dashboardQuery.to ?? undefined,
    project_type: filters.project_type, assigned_to: filters.assigned_to,
  }
  const leads = result?.leads ?? []
  const ownerIds = Array.from(new Set(leads.map((lead) => lead.assigned_to).filter((id): id is string => Boolean(id))))
  if (admin.id !== filters.assigned_to && !ownerIds.includes(admin.id)) ownerIds.unshift(admin.id)
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-10 text-[#f1f1ed] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="leads" />
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Área administrativa</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Leads</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">Encontre contatos e acompanhe o próximo passo de cada oportunidade.</p>
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-sm text-[#aaa] sm:block">
              Olá, <span className="text-[#eee]">{admin.name ?? "equipe"}</span>
            </p>
            <Link href="/painel-8f2k/leads/novo" className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#fbd020] px-4 text-sm font-semibold text-[#151510] hover:bg-[#ffe45d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">
              + Novo lead
            </Link>
          </div>
        </header>
        <LeadDashboard
          overview={overview}
          risk={risk}
          agenda={agenda}
          selectedDates={{ from: dashboardQuery.from ?? undefined, to: dashboardQuery.to ?? undefined }}
          invalidPeriod={!parsedDashboard.success}
          preservedFilters={{
            search: filters.search,
            status: filters.status,
            tag: filters.tag,
            project_type: filters.project_type,
            assigned_to: filters.assigned_to,
          }}
        />

        <section className="mb-7 rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6" aria-label="Busca e filtros">
          <Form action="/painel-8f2k/leads" method="get" className="gap-4">
            {currentFilters.from && <input type="hidden" name="from" value={currentFilters.from} />}
            {currentFilters.to && <input type="hidden" name="to" value={currentFilters.to} />}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
              <FormField htmlFor="search" label="Buscar lead" className="sm:col-span-2 xl:col-span-2">
                <FormInput id="search" name="search" type="search" placeholder="Nome, empresa, e-mail ou WhatsApp" defaultValue={filters.search} autoComplete="off" />
              </FormField>
              <FormField htmlFor="status" label="Status">
                <FormSelect id="status" name="status" defaultValue={filters.status ?? ""}>
                  <option value="">Todos os status</option>
                  {LEAD_STATUS_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                </FormSelect>
              </FormField>
              <FormField htmlFor="project_type" label="Tipo de projeto">
                <FormInput id="project_type" name="project_type" placeholder="Ex.: site, aplicativo" defaultValue={filters.project_type} />
              </FormField>
              <FormField htmlFor="tag" label="Tag">
                <FormInput id="tag" name="tag" placeholder="Digite uma tag exata" defaultValue={filters.tag} />
              </FormField>
              <FormField htmlFor="assigned_to" label="Responsável" className="sm:col-span-2 xl:col-span-2" hint="Você e responsáveis encontrados nesta página.">
                <FormSelect id="assigned_to" name="assigned_to" defaultValue={filters.assigned_to ?? ""}>
                  <option value="">Todos os responsáveis</option>
                  {ownerIds.map((id) => <option key={id} value={id}>{id === admin.id ? "Você" : "Membro da equipe · " + id.slice(0, 8)}</option>)}
                </FormSelect>
              </FormField>
              <div className="flex items-end gap-3 sm:col-span-2 xl:col-span-3">
                <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510] transition hover:bg-[#ffe45d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">
                  Aplicar filtros
                </button>
                <Link href="/painel-8f2k/leads" className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-[#c2c2bb] underline-offset-4 hover:text-white hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">Limpar</Link>
              </div>
            </div>
          </Form>
        </section>

        {failed ? (
          <div role="alert" className="rounded-xl border border-red-900/70 bg-red-950/30 p-5 text-sm text-red-200">Não foi possível carregar os leads agora. Tente atualizar a página.</div>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#aaa]">
              <p>{result?.total === 1 ? "1 lead encontrado" : (result?.total ?? 0) + " leads encontrados"}</p>
              {result && result.total > 0 && <p>Página {result.page} de {totalPages}</p>}
            </div>

            {leads.length === 0 ? (
              <section className="rounded-xl border border-dashed border-[#3a3b37] bg-[#181916] px-6 py-14 text-center">
                <h2 className="text-lg font-semibold text-[#eee]">Nenhum lead encontrado</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#aaa]">Tente ajustar a busca ou remover alguns filtros para ver outros resultados.</p>
              </section>
            ) : (
              <ul className="grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-2">
                {leads.map((lead) => {
                  const nextActionDate = lead.next_action_at ? new Date(lead.next_action_at) : null
                  return (
                    <li key={lead.id} className="min-w-0 rounded-xl border border-[#292b28] bg-[#181916] p-5 transition-colors hover:border-[#48483c] sm:p-6">
                      <article aria-labelledby={"lead-" + lead.id}>
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 id={"lead-" + lead.id} className="truncate text-lg font-semibold text-white"><Link prefetch={false} href={"/painel-8f2k/leads/" + lead.id} className="rounded-sm hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]">{lead.name}</Link></h2>
                            {lead.company && <p className="mt-1 truncate text-sm text-[#b6b6ae]">{lead.company}</p>}
                          </div>
                          <span className={"shrink-0 rounded-full border px-3 py-1 text-xs font-medium " + statusStyle(lead.status)}>{LEAD_STATUS_LABELS[lead.status] ?? lead.status}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#aaa]">
                          <a className="break-all underline-offset-4 hover:text-white hover:underline" href={"mailto:" + lead.email}>{lead.email}</a>
                          <a className="hover:text-white hover:underline" href={"tel:" + lead.whatsapp}>{lead.whatsapp}</a>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
                          <span className="rounded-md bg-[#242522] px-2.5 py-1.5 text-[#d3d3cb]">{lead.project_type}</span>
                          <span className="text-[#85867f]">Recebido em {formatDate(lead.created_at)}</span>
                          {lead.source === "site" && <span className="rounded-md border border-[#3a3b37] px-2 py-1 text-[#aaa]">Site</span>}
                        </div>
                        {(lead.tags?.length ?? 0) > 0 && (
                          <ul aria-label="Tags" className="mt-3 flex list-none flex-wrap gap-2 p-0">
                            {lead.tags?.map((tag) => <li key={tag} className="rounded-full border border-[#3c3c35] px-2.5 py-1 text-xs text-[#c7c2a4]">{tag}</li>)}
                          </ul>
                        )}
                        <div className="mt-5 border-t border-[#292b28] pt-4">
                          {lead.next_action ? (
                            <p className="text-sm">
                              <span className="text-[#85867f]">Próxima ação: </span><span className="text-[#e5e5df]">{lead.next_action}</span>
                              {nextActionDate && <span className="ml-2 text-xs text-[#aaa]">· {formatDate(lead.next_action_at as string)}</span>}
                            </p>
                          ) : <p className="text-sm text-[#85867f]">Nenhuma próxima ação definida</p>}
                          <p className="mt-2 text-xs text-[#85867f]">
                            Responsável: {lead.assigned_to === admin.id ? "Você" : lead.assigned_to ? "Membro da equipe" : "Não atribuído"}
                            {lead.responded_at ? " · Respondido" : " · Ainda sem resposta"}
                          </p>
                        </div>
                        {lead.possible_duplicate_of && <p className="mt-3 rounded-md border border-amber-900/50 bg-amber-950/20 px-3 py-2 text-xs text-amber-200">Possível duplicidade — confirme antes de iniciar outro contato.</p>}
                      </article>
                    </li>
                  )
                })}
              </ul>
            )}

            {result && totalPages > 1 && (
              <nav aria-label="Paginação dos leads" className="mt-7 flex items-center justify-between gap-3">
                {result.page > 1 ? <Link className="rounded-md border border-[#3a3b37] px-4 py-2 text-sm text-[#ddd] hover:border-[#fbd020] focus-visible:outline-2 focus-visible:outline-[#fbd020]" href={pageHref(result.page - 1, currentFilters)}>← Anterior</Link> : <span />}
                <span className="text-sm text-[#999]">{result.page} / {totalPages}</span>
                {result.page < totalPages ? <Link className="rounded-md border border-[#3a3b37] px-4 py-2 text-sm text-[#ddd] hover:border-[#fbd020] focus-visible:outline-2 focus-visible:outline-[#fbd020]" href={pageHref(result.page + 1, currentFilters)}>Próxima →</Link> : <span />}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}
