import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { StatCard } from "@/components/admin/stat-card"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { listContracts, type ListContractsResult } from "@/lib/contracts/list-contracts"
import { getFinancialBalance, type FinancialBalance } from "@/lib/finance/get-financial-balance"
import { getFinancialCharts, type FinancialCharts } from "@/lib/finance/get-financial-charts"
import { getProspectingOverview, type ProspectingOverview } from "@/lib/leads/get-prospecting-overview"
import { createClient } from "@/lib/supabase/server"

import { ExpenseCategoryChart } from "./expense-category-chart"
import { IncomeExpenseChart } from "./income-expense-chart"
import { LeadsFunnelChart } from "./leads-funnel-chart"
import { LeadsVolumeChart } from "./leads-volume-chart"

export const metadata: Metadata = {
  title: "Visão geral — Vexiom",
  robots: { index: false, follow: false },
}

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const percent = new Intl.NumberFormat("pt-BR", { style: "percent", maximumFractionDigits: 1 })
// Grouped thousand separators keep counts legible as they grow (e.g. "1.234" not "1234").
const count = new Intl.NumberFormat("pt-BR")

function ErrorState({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded-xl border border-red-900/70 bg-red-950/30 p-5 text-sm text-red-200">
      {message}
    </div>
  )
}

function SectionHeader({ id, eyebrow, title }: { id: string; eyebrow: string; title: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">{eyebrow}</p>
      <h2 id={id} className="mt-1 text-xl font-semibold text-white">{title}</h2>
    </div>
  )
}

export default async function PainelIndexPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")

  const supabase = await createClient()
  const isSuperAdmin = admin.role === "super_admin"

  let overview: ProspectingOverview | null = null
  let overviewError = false
  try {
    overview = await getProspectingOverview(supabase, {})
  } catch (error) {
    console.error("PainelIndexPage: failed to load prospecting overview", error)
    overviewError = true
  }

  let balance: FinancialBalance | null = null
  let balanceError = false
  let charts: FinancialCharts | null = null
  let chartsError = false
  let contracts: ListContractsResult | null = null
  let contractsError = false

  if (isSuperAdmin) {
    ;[balance, charts, contracts] = await Promise.all([
      getFinancialBalance(supabase, {}).catch((error) => {
        console.error("PainelIndexPage: failed to load financial balance", error)
        balanceError = true
        return null
      }),
      getFinancialCharts(supabase, admin, {}).catch((error) => {
        console.error("PainelIndexPage: failed to load financial charts", error)
        chartsError = true
        return null
      }),
      listContracts(supabase, admin, { page: 1, page_size: 1 }).catch((error) => {
        console.error("PainelIndexPage: failed to load contracts", error)
        contractsError = true
        return null
      }),
    ])
  }

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="overview" />
        <header className="mb-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Gestão interna</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Visão geral</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">
            Panorama consolidado da prospecção{isSuperAdmin ? ", finanças e contratos" : ""}.
          </p>
        </header>

        {isSuperAdmin && (
          <section aria-labelledby="financial-section-title" className="mb-10">
            <SectionHeader id="financial-section-title" eyebrow="Financeiro" title="Caixa" />
            {balanceError || !balance ? (
              <ErrorState message="Não foi possível carregar o saldo financeiro agora." />
            ) : (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <StatCard label="Entradas no período" value={money.format(balance.income)} />
                <StatCard label="Saídas no período" value={money.format(balance.expense)} />
                <StatCard
                  label="Saldo do período"
                  value={money.format(balance.balance)}
                  trend={{
                    direction: balance.balance >= 0 ? "up" : "down",
                    label: balance.balance >= 0 ? "Positivo" : "Negativo",
                  }}
                />
              </div>
            )}

            {chartsError || !charts ? (
              <ErrorState message="Não foi possível carregar os gráficos financeiros agora." />
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-white">Entradas x saídas por mês</h3>
                  {charts.incomeExpenseByMonth.every((m) => m.income === 0 && m.expense === 0) ? (
                    <p className="py-10 text-center text-sm text-[#aaa]">Nenhum lançamento registrado.</p>
                  ) : (
                    <IncomeExpenseChart data={charts.incomeExpenseByMonth} />
                  )}
                </div>
                <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-white">Saídas por categoria</h3>
                  {charts.expenseByCategory.length === 0 ? (
                    <p className="py-10 text-center text-sm text-[#aaa]">Nenhuma saída registrada.</p>
                  ) : (
                    <ExpenseCategoryChart data={charts.expenseByCategory} />
                  )}
                </div>
              </div>
            )}
          </section>
        )}

        <section aria-labelledby="prospecting-section-title" className="mb-10">
          <SectionHeader id="prospecting-section-title" eyebrow="Prospecção" title="Leads" />
          {overviewError || !overview ? (
            <ErrorState message="Não foi possível carregar os indicadores de prospecção agora." />
          ) : (
            <>
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Leads no período" value={count.format(overview.totalLeads)} />
                <StatCard
                  label="Taxa de conversão"
                  value={percent.format(overview.conversionRate)}
                  hint="Contratos fechados / total de leads"
                />
                <StatCard
                  label="Contratos fechados"
                  value={count.format(overview.funnel.contrato_fechado)}
                />
                <StatCard
                  label="Follow-up pendente"
                  value={count.format(overview.funnel.follow_up_pendente)}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-white">Volume de leads por mês</h3>
                  {overview.volumeByMonth.every((m) => m.count === 0) ? (
                    <p className="py-10 text-center text-sm text-[#aaa]">Nenhum lead registrado.</p>
                  ) : (
                    <LeadsVolumeChart data={overview.volumeByMonth} />
                  )}
                </div>
                <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5">
                  <h3 className="mb-3 text-sm font-semibold text-white">Leads por status</h3>
                  {overview.totalLeads === 0 ? (
                    <p className="py-10 text-center text-sm text-[#aaa]">Nenhum lead registrado.</p>
                  ) : (
                    <LeadsFunnelChart funnel={overview.funnel} />
                  )}
                </div>
              </div>
            </>
          )}
        </section>

        {isSuperAdmin && (
          <section aria-labelledby="contracts-section-title">
            <SectionHeader id="contracts-section-title" eyebrow="Contratos" title="Contratos registrados" />
            {contractsError || !contracts ? (
              <ErrorState message="Não foi possível carregar os contratos agora." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:max-w-xs">
                <StatCard label="Total de contratos" value={count.format(contracts.total)} />
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  )
}
