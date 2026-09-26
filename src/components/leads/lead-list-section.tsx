import Link from "next/link"

import { Form, FormField, FormInput, FormSelect } from "@/components/forms/form"
import { LeadListItem } from "@/components/leads/lead-list-item"
import { LEAD_STATUS_OPTIONS } from "@/components/leads/lead-status-labels"
import type { ListLeadsResult } from "@/lib/leads/list-leads"
import type { ListLeadsQuery } from "@/lib/leads/list-leads-schema"

function pageHref(page: number, filters: ListLeadsQuery) {
  const params = new URLSearchParams({ section: "list", page: String(page) })
  if (filters.search) params.set("search", filters.search)
  if (filters.status) params.set("status", filters.status)
  if (filters.tag) params.set("tag", filters.tag)
  if (filters.project_type) params.set("project_type", filters.project_type)
  if (filters.assigned_to) params.set("assigned_to", filters.assigned_to)
  if (filters.page_size !== 20) params.set("page_size", String(filters.page_size))
  return "/painel-8f2k/leads?" + params.toString()
}

export function LeadListSection({
  result,
  failed,
  filters,
  adminId,
}: {
  result?: ListLeadsResult
  failed: boolean
  filters: ListLeadsQuery
  adminId: string
}) {
  const leads = result?.leads ?? []
  const ownerIds = Array.from(new Set(leads.map((lead) => lead.assigned_to).filter((id): id is string => Boolean(id))))
  if (adminId !== filters.assigned_to && !ownerIds.includes(adminId)) ownerIds.unshift(adminId)
  const totalPages = result ? Math.max(1, Math.ceil(result.total / result.pageSize)) : 1
  const advancedFiltersOpen = Boolean(filters.project_type || filters.tag || filters.assigned_to)

  return (
    <section aria-labelledby="lead-list-title">
      <header className="mb-5 flex flex-col items-start justify-between gap-3 sm:mb-6 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Base comercial</p>
          <h2 id="lead-list-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">Lista de leads</h2>
          <p className="mt-2 text-sm leading-6 text-[#aeb5ab]">Encontre um contato e abra seu histórico completo.</p>
        </div>
        {!failed && (
          <p className="rounded-full border border-[#3b4239] bg-[#171a17] px-3 py-1.5 text-sm text-[#c8cec5]">
            <span className="font-semibold text-white">{result?.total ?? 0}</span> {result?.total === 1 ? "lead" : "leads"}
          </p>
        )}
      </header>

      <section aria-label="Busca e filtros" className="mb-6 rounded-2xl border border-[#343a32] bg-[#171a17] p-4 sm:p-6">
        <Form action="/painel-8f2k/leads" method="get" className="gap-5">
          {filters.page_size !== 20 && <input type="hidden" name="page_size" value={filters.page_size} />}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(220px,0.7fr)_auto]">
            <FormField htmlFor="search" label="Buscar">
              <FormInput
                id="search"
                name="search"
                type="search"
                placeholder="Nome, empresa, e-mail ou WhatsApp"
                defaultValue={filters.search}
                autoComplete="off"
              />
            </FormField>
            <FormField htmlFor="status" label="Etapa comercial">
              <FormSelect id="status" name="status" defaultValue={filters.status ?? ""}>
                <option value="">Todos os status</option>
                {LEAD_STATUS_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
              </FormSelect>
            </FormField>
            <button type="submit" className="min-h-11 w-full self-end rounded-lg bg-[#fbd020] px-6 text-sm font-semibold text-[#17140a] transition hover:bg-[#ffe15b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020] lg:w-auto">
              Buscar
            </button>
          </div>

          <details open={advancedFiltersOpen} className="group border-t border-[#30362e] pt-4">
            <summary className="inline-flex min-h-9 cursor-pointer list-none items-center gap-2 rounded-md text-sm font-medium text-[#c7cec4] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">
              <span aria-hidden="true" className="text-[#fbd020] group-open:rotate-45">+</span>
              Mais filtros
            </summary>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormField htmlFor="project_type" label="Tipo de projeto">
                <FormInput id="project_type" name="project_type" placeholder="Ex.: site, aplicativo" defaultValue={filters.project_type} />
              </FormField>
              <FormField htmlFor="tag" label="Tag">
                <FormInput id="tag" name="tag" placeholder="Digite uma tag exata" defaultValue={filters.tag} />
              </FormField>
              <FormField htmlFor="assigned_to" label="Responsável" hint="Responsáveis presentes nesta página.">
                <FormSelect id="assigned_to" name="assigned_to" defaultValue={filters.assigned_to ?? ""}>
                  <option value="">Todos os responsáveis</option>
                  {ownerIds.map((id) => (
                    <option key={id} value={id}>{id === adminId ? "Você" : "Membro da equipe · " + id.slice(0, 8)}</option>
                  ))}
                </FormSelect>
              </FormField>
            </div>
          </details>

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button type="submit" className="inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-[#596156] px-4 text-sm font-semibold text-white hover:border-[#fbd020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020] sm:w-auto">
              Aplicar todos os filtros
            </button>
            <Link href="/painel-8f2k/leads?section=list" className="inline-flex min-h-10 items-center justify-center px-2 text-sm text-[#aeb5ab] underline-offset-4 hover:text-white hover:underline sm:w-auto">
              Limpar filtros
            </Link>
          </div>
        </Form>
      </section>

      {failed ? (
        <div role="alert" className="rounded-2xl border border-red-900/70 bg-red-950/30 p-5 text-sm text-red-100">
          Não foi possível carregar os leads agora. Tente atualizar a página.
        </div>
      ) : leads.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-[#3c443a] bg-[#141714] px-6 py-14 text-center">
          <h3 className="text-lg font-semibold text-white">Nenhum lead encontrado</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#a9b0a6]">
            Ajuste a busca ou limpe os filtros para consultar outros contatos.
          </p>
        </section>
      ) : (
        <>
          <ul className="list-none divide-y divide-[#30362e] overflow-hidden rounded-2xl border border-[#343a32] bg-[#171a17] p-0">
            {leads.map((lead) => (
              <li key={lead.id} className="transition-colors hover:bg-[#1c201c]">
                <LeadListItem lead={lead} adminId={adminId} />
              </li>
            ))}
          </ul>

          {result && totalPages > 1 && (
            <nav aria-label="Paginação dos leads" className="mt-7 flex items-center justify-between gap-3">
              {result.page > 1
                ? <Link className="rounded-lg border border-[#4a5147] px-4 py-2 text-sm text-[#e0e5dd] hover:border-[#fbd020]" href={pageHref(result.page - 1, filters)}>← Anterior</Link>
                : <span />}
              <span className="text-sm text-[#9da49a]">{result.page} de {totalPages}</span>
              {result.page < totalPages
                ? <Link className="rounded-lg border border-[#4a5147] px-4 py-2 text-sm text-[#e0e5dd] hover:border-[#fbd020]" href={pageHref(result.page + 1, filters)}>Próxima →</Link>
                : <span />}
            </nav>
          )}
        </>
      )}
    </section>
  )
}
