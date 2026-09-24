import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { Form, FormField, FormInput, FormSelect } from "@/components/forms/form"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Financeiro — Vexiom",
  robots: { index: false, follow: false },
}

type Transaction = Pick<
  Database["public"]["Tables"]["financial_transactions"]["Row"],
  "id" | "direction" | "category" | "amount" | "occurred_at" |
  "description" | "project_id" | "partner_id"
>
type ProjectOption = { id: string; title: string }

const PAGE_SIZE = 20
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

function validDate(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value)))
}

function formatDate(value: string) {
  const [year, month, day] = value.split("-")
  return day + "/" + month + "/" + year
}

function pageHref(page: number, from: string, to: string, projectId?: string) {
  const params = new URLSearchParams({ from, to, page: String(page) })
  if (projectId) params.set("project_id", projectId)
  return "/painel-8f2k/financeiro?" + params.toString()
}

export default async function FinancialPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const raw = await searchParams
  const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date())
  const defaultFrom = today.slice(0, 7) + "-01"
  const requestedFrom = first(raw.from)
  const requestedTo = first(raw.to)
  const from = validDate(requestedFrom) && validDate(requestedTo) && requestedFrom <= requestedTo
    ? requestedFrom : defaultFrom
  const to = validDate(requestedFrom) && validDate(requestedTo) && requestedFrom <= requestedTo
    ? requestedTo : today
  const requestedPage = Number(first(raw.page))
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 10000 ? requestedPage : 1
  const requestedProject = first(raw.project_id)
  const projectId = requestedProject && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(requestedProject)
    ? requestedProject : undefined

  let entries: Transaction[] = []
  let projects: ProjectOption[] = []
  let total = 0
  let failed = false

  try {
    const supabase = await createClient()
    const start = (page - 1) * PAGE_SIZE
    let query = supabase
      .from("financial_transactions")
      .select("id,direction,category,amount,occurred_at,description,project_id,partner_id", { count: "exact" })
      .gte("occurred_at", from)
      .lte("occurred_at", to)
    if (projectId) query = query.eq("project_id", projectId)

    const [entryResult, projectResult] = await Promise.all([
      query.order("occurred_at", { ascending: false }).range(start, start + PAGE_SIZE - 1),
      supabase.from("projects").select("id,title").order("title", { ascending: true }).limit(500),
    ])
    if (entryResult.error) throw entryResult.error
    entries = entryResult.data ?? []
    total = entryResult.count ?? 0
    if (projectResult.error) {
      console.error("FinancialPage: failed to load project names", projectResult.error)
    } else {
      projects = projectResult.data ?? []
    }
  } catch (error) {
    console.error("FinancialPage: failed to load transactions", error)
    failed = true
  }

  const projectNames = new Map(projects.map((project) => [project.id, project.title]))
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="financeiro" />
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Gestão interna</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Financeiro</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">Acompanhe os lançamentos e identifique aportes pessoais com clareza.</p>
          </div>
          <Link href="/painel-8f2k/financeiro/novo" className="inline-flex min-h-11 items-center rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510] hover:bg-[#ffe45d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">+ Novo lançamento</Link>
        </header>

        <section aria-labelledby="financial-period-title" className="mb-6 rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
          <h2 id="financial-period-title" className="text-base font-semibold text-white">Período</h2>
          <Form action="/painel-8f2k/financeiro" method="get" className="mt-4 gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.3fr_auto]">
              <FormField htmlFor="financial-from" label="De">
                <FormInput id="financial-from" name="from" type="date" defaultValue={from} required />
              </FormField>
              <FormField htmlFor="financial-to" label="Até">
                <FormInput id="financial-to" name="to" type="date" defaultValue={to} required />
              </FormField>
              <FormField htmlFor="financial-project" label="Projeto">
                <FormSelect id="financial-project" name="project_id" defaultValue={projectId ?? ""}>
                  <option value="">Todos os projetos</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                </FormSelect>
              </FormField>
              <button type="submit" className="min-h-11 self-end rounded-md border border-[#54554a] px-5 text-sm font-semibold text-white hover:border-[#fbd020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">Aplicar</button>
            </div>
          </Form>
        </section>

        <section aria-labelledby="financial-summary-title" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <h2 id="financial-summary-title" className="sr-only">Resumo do período</h2>
          <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5"><p className="text-xs text-[#aaa]">Lançamentos no período</p><p className="mt-2 text-3xl font-semibold tabular-nums text-white">{failed ? "—" : total}</p></div>
          <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5"><p className="text-xs text-[#aaa]">Saldo do período</p><p className="mt-2 text-3xl font-semibold text-white">—</p><p className="mt-1 text-xs text-[#85867f]">Consolidado ainda indisponível</p></div>
          <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5"><p className="text-xs text-[#aaa]">Lucro por projeto</p><p className="mt-2 text-3xl font-semibold text-white">—</p><p className="mt-1 text-xs text-[#85867f]">Selecione um projeto para consultar</p></div>
        </section>

        <section aria-labelledby="financial-list-title">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Livro-caixa</p>
              <h2 id="financial-list-title" className="mt-1 text-xl font-semibold text-white">Lançamentos</h2>
            </div>
            {!failed && total > 0 && <span className="text-xs text-[#999]">Página {page} de {totalPages}</span>}
          </div>

          {failed ? (
            <div role="alert" className="rounded-xl border border-red-900/70 bg-red-950/30 p-5 text-sm text-red-200">Não foi possível carregar os lançamentos agora.</div>
          ) : entries.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#3a3b37] bg-[#181916] p-10 text-center text-sm text-[#aaa]">Nenhum lançamento para este período e projeto.</div>
          ) : (
            <ul className="list-none space-y-3 p-0">
              {entries.map((entry) => (
                <li key={entry.id} className="rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-5">
                  <article className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={entry.direction === "entrada" ? "rounded-full border border-emerald-800 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-300" : "rounded-full border border-[#734235] bg-red-950/30 px-2.5 py-1 text-xs text-[#e9b0a5]"}>
                          {entry.direction === "entrada" ? "Entrada" : "Saída"}
                        </span>
                        {entry.partner_id && <span className="rounded-full border border-[#8a7026] bg-[#302813] px-2.5 py-1 text-xs font-semibold text-[#ffdf78]">Aporte pessoal{entry.partner_id === admin.id ? " · você" : " · sócio"}</span>}
                        <span className="text-xs text-[#92938d]">{formatDate(entry.occurred_at)}</span>
                      </div>
                      <h3 className="mt-2 break-words text-sm font-semibold text-white">{entry.description}</h3>
                      <p className="mt-1 text-xs text-[#999]">{entry.category}{entry.project_id ? " · " + (projectNames.get(entry.project_id) ?? "Projeto vinculado") : ""}</p>
                    </div>
                    <p className={entry.direction === "entrada" ? "shrink-0 text-lg font-semibold tabular-nums text-emerald-300" : "shrink-0 text-lg font-semibold tabular-nums text-[#ffb0a5]"}>
                      {entry.direction === "entrada" ? "+" : "−"}{money.format(Number(entry.amount))}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          )}

          {!failed && totalPages > 1 && (
            <nav aria-label="Páginas de lançamentos" className="mt-7 flex items-center justify-center gap-3 text-sm">
              {page > 1 && <Link href={pageHref(page - 1, from, to, projectId)} className="rounded-md border border-[#3a3b37] px-4 py-2 text-[#ddd] hover:border-[#fbd020]">← Anterior</Link>}
              <span className="text-[#aaa]">{page} / {totalPages}</span>
              {page < totalPages && <Link href={pageHref(page + 1, from, to, projectId)} className="rounded-md border border-[#3a3b37] px-4 py-2 text-[#ddd] hover:border-[#fbd020]">Próxima →</Link>}
            </nav>
          )}
        </section>
      </div>
    </main>
  )
}
