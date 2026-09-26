import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"

import { ExpenseCategoryChart } from "../expense-category-chart"
import { IncomeExpenseChart } from "../income-expense-chart"
import { Form, FormField, FormInput, FormSelect } from "@/components/forms/form"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Financeiro - Vexiom",
  robots: { index: false, follow: false },
}

type Transaction = Pick<
  Database["public"]["Tables"]["financial_transactions"]["Row"],
  "id" | "direction" | "category" | "amount" | "occurred_at" |
  "description" | "project_id" | "partner_id"
>
type ProjectOption = { id: string; title: string }
type FinancialAnalyticsEntry = Pick<Transaction, "direction" | "category" | "amount" | "occurred_at" | "partner_id">

const PAGE_SIZE = 20
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })

function validDate(value: string | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(value + "T00:00:00Z")
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
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
  const hasCustomPeriod = requestedFrom !== undefined || requestedTo !== undefined
  const validPeriod = validDate(requestedFrom) && validDate(requestedTo) && requestedFrom <= requestedTo
  const from = validPeriod ? requestedFrom : defaultFrom
  const to = validPeriod ? requestedTo : today
  const requestedPage = Number(first(raw.page))
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 && requestedPage <= 10000 ? requestedPage : 1
  const requestedProject = first(raw.project_id)
  const projectId = requestedProject && /^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(requestedProject)
    ? requestedProject : undefined

  let entries: Transaction[] = []
  let projects: ProjectOption[] = []
  let total = 0
  let analyticsEntries: FinancialAnalyticsEntry[] = []
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

    let analyticsQuery = supabase
      .from("financial_transactions")
      .select("direction,category,amount,occurred_at,partner_id")
      .gte("occurred_at", from)
      .lte("occurred_at", to)
      .limit(5000)
    if (projectId) analyticsQuery = analyticsQuery.eq("project_id", projectId)

    const [entryResult, analyticsResult, projectResult] = await Promise.all([
      query.order("occurred_at", { ascending: false }).range(start, start + PAGE_SIZE - 1),
      analyticsQuery,
      supabase.from("projects").select("id,title").order("title", { ascending: true }).limit(500),
    ])
    if (entryResult.error) throw entryResult.error
    if (analyticsResult.error) throw analyticsResult.error
    entries = entryResult.data ?? []
    analyticsEntries = analyticsResult.data ?? []
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
  const income = analyticsEntries.filter((entry) => entry.direction === "entrada").reduce((sum, entry) => sum + Number(entry.amount), 0)
  const expense = analyticsEntries.filter((entry) => entry.direction === "saida").reduce((sum, entry) => sum + Number(entry.amount), 0)
  const balance = income - expense
  const personalContributions = analyticsEntries.filter((entry) => entry.partner_id).reduce((sum, entry) => sum + Number(entry.amount), 0)
  const monthlyMap = new Map<string, { month: string; income: number; expense: number }>()
  for (const entry of analyticsEntries) {
    const month = entry.occurred_at.slice(0, 7)
    const current = monthlyMap.get(month) ?? { month, income: 0, expense: 0 }
    if (entry.direction === "entrada") current.income += Number(entry.amount)
    else current.expense += Number(entry.amount)
    monthlyMap.set(month, current)
  }
  const monthlyFlow = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month))
  const categoryMap = new Map<string, number>()
  for (const entry of analyticsEntries) {
    if (entry.direction === "saida") categoryMap.set(entry.category, (categoryMap.get(entry.category) ?? 0) + Number(entry.amount))
  }
  const expenseByCategory = Array.from(categoryMap, ([category, amount]) => ({ category, amount })).sort((a, b) => b.amount - a.amount)
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#111210] px-4 py-5 text-[#f1f1ed] sm:px-6 sm:py-8 lg:px-12 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="financeiro" />
        <header className="mb-6 flex flex-col gap-5 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Gestão interna</p>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-4xl">Financeiro</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">Acompanhe os lançamentos e identifique aportes pessoais com clareza.</p>
          </div>
          <Link href="/painel-8f2k/financeiro/novo" className="inline-flex min-h-11 w-full items-center justify-center rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510] sm:w-auto hover:bg-[#ffe45d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">+ Novo lançamento</Link>
        </header>

        {hasCustomPeriod && !validPeriod && (
          <p role="alert" className="mb-4 rounded-md border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            Período inválido. Exibindo o mês atual; escolha uma data inicial anterior ou igual à final.
          </p>
        )}

        <section aria-labelledby="financial-period-title" className="mb-5 rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:mb-6 sm:p-6">
          <h2 id="financial-period-title" className="text-base font-semibold text-white">Período</h2>
          <Form action="/painel-8f2k/financeiro" method="get" className="mt-4 gap-3 sm:gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-[1fr_1fr_1.3fr_auto]">
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
              <button type="submit" className="min-h-11 w-full self-end rounded-md border sm:w-auto border-[#54554a] px-5 text-sm font-semibold text-white hover:border-[#fbd020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">Aplicar</button>
            </div>
          </Form>
        </section>

        <section aria-labelledby="financial-summary-title" className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <h2 id="financial-summary-title" className="sr-only">Resumo do período</h2>
          <div className="min-w-0 rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-5"><p className="text-xs text-[#aaa]">Entradas</p><p className="mt-2 text-xl font-semibold tabular-nums text-emerald-300 sm:text-2xl">{failed ? "-" : money.format(income)}</p><p className="mt-1 text-xs text-[#85867f]">{total} lançamentos no período</p></div>
          <div className="min-w-0 rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-5"><p className="text-xs text-[#aaa]">Saídas</p><p className="mt-2 text-xl font-semibold tabular-nums text-[#ffb0a5] sm:text-2xl">{failed ? "-" : money.format(expense)}</p><p className="mt-1 text-xs text-[#85867f]">Despesas registradas</p></div>
          <div className="min-w-0 rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-5"><p className="text-xs text-[#aaa]">Saldo do período</p><p className={"mt-2 text-xl font-semibold tabular-nums sm:text-2xl " + (balance >= 0 ? "text-emerald-300" : "text-[#ffb0a5]")}>{failed ? "-" : money.format(balance)}</p><p className="mt-1 text-xs text-[#85867f]">Entradas menos saídas</p></div>
          <div className="min-w-0 rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-5"><p className="text-xs text-[#aaa]">Aportes pessoais</p><p className="mt-2 text-xl font-semibold tabular-nums text-[#ffdf78] sm:text-2xl">{failed ? "-" : money.format(personalContributions)}</p><p className="mt-1 text-xs text-[#85867f]">Valores identificados como aporte</p></div>
        </section>

        <section aria-labelledby="financial-charts-title" className="mb-6 grid grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-[1.45fr_1fr]">
          <div className="min-w-0 rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-6">
            <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Visão do período</p><h2 id="financial-charts-title" className="mt-1 text-lg font-semibold text-white">Entradas e saídas</h2></div>
            {monthlyFlow.length > 0 ? <IncomeExpenseChart data={monthlyFlow} /> : <p className="flex min-h-[260px] items-center justify-center text-sm text-[#85867f]">Sem dados para montar o gráfico.</p>}
          </div>
          <div className="min-w-0 rounded-xl border border-[#292b28] bg-[#181916] p-4 sm:p-6">
            <div className="mb-4"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Onde saiu o dinheiro</p><h2 className="mt-1 text-lg font-semibold text-white">Despesas por categoria</h2></div>
            {expenseByCategory.length > 0 ? <ExpenseCategoryChart data={expenseByCategory} /> : <p className="flex min-h-[180px] items-center justify-center text-sm text-[#85867f]">Sem saídas categorizadas.</p>}
          </div>
        </section>

        <section aria-labelledby="financial-list-title">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-3">
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
                  <article className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
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
                    <p className={entry.direction === "entrada" ? "shrink-0 text-base font-semibold tabular-nums text-emerald-300 sm:text-lg" : "shrink-0 text-base font-semibold tabular-nums text-[#ffb0a5] sm:text-lg"}>
                      {entry.direction === "entrada" ? "+" : "−"}{money.format(Number(entry.amount))}
                    </p>
                  </article>
                </li>
              ))}
            </ul>
          )}

          {!failed && totalPages > 1 && (
            <nav aria-label="Páginas de lançamentos" className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm">
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
