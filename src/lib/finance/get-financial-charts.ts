import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { CurrentAdmin } from "@/lib/auth/get-current-admin"
import { fetchTransactionsInPeriod } from "@/lib/finance/fetch-transactions-in-period"
import type { FinancialPeriodQuery } from "@/lib/finance/financial-period-schema"
import { fromCents, toCents } from "@/lib/finance/money"
import { resolveFinancialPeriod } from "@/lib/finance/resolve-financial-period"
import { createAdminClient } from "@/lib/supabase/admin"
import type { Database } from "@/lib/supabase/database.types"

export type FinancialCharts = {
  from: string
  to: string
  incomeExpenseByMonth: { month: string; income: number; expense: number }[]
  expenseByCategory: { category: string; amount: number }[]
  contributionByPartner: { partnerId: string; partnerName: string | null; amount: number }[]
}

function monthsBetween(from: string, to: string): string[] {
  const months: string[] = []
  let [year, month] = from.split("-").map(Number)
  const [toYear, toMonth] = to.split("-").map(Number)

  while (year < toYear || (year === toYear && month <= toMonth)) {
    months.push(`${year}-${String(month).padStart(2, "0")}`)
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return months
}

/**
 * `admin_users` RLS only lets a user read their own row (`auth.uid() =
 * user_id`) — not even `super_admin` can read another admin's row through
 * the request-scoped client. Resolving partner display names therefore
 * requires the service-role client (`createAdminClient`, already used for
 * the public leads insert path), scoped to only the partner ids that
 * actually appear in this period's transactions — never a full-table read.
 *
 * Gated on `isSuperAdmin` by the caller (`getFinancialCharts` below) rather
 * than trusting the wiring around this module to always check first: this
 * is the one function in the finance domain that bypasses RLS, so it
 * carries its own defense-in-depth check instead of relying purely on every
 * future caller remembering to gate the page/action.
 */
async function resolvePartnerNames(partnerIds: string[]): Promise<Map<string, string | null>> {
  if (partnerIds.length === 0) return new Map()

  const { data, error } = await createAdminClient()
    .from("admin_users")
    .select("user_id, name")
    .in("user_id", partnerIds)

  if (error) {
    console.error("getFinancialCharts: failed to resolve partner names", error)
    return new Map()
  }

  return new Map((data ?? []).map((row) => [row.user_id, row.name]))
}

/**
 * Aggregates the three financial dashboard charts (FR38/39/40) from a
 * single paginated fetch.
 *
 * `contributionByPartner` sums `amount` across both directions per partner
 * rather than netting entrada − saida — a `saida` tagged with `partner_id`
 * means the partner personally covered that cost out of pocket, which is
 * just as much "money financiado by that partner" as an `entrada` deposit
 * (doc 08: "total financiado por cada sócio", not "saldo"). Netting would
 * understate a partner who deposited money and then spent some of it
 * themselves on a company expense.
 */
export async function getFinancialCharts(
  supabase: SupabaseClient<Database>,
  admin: CurrentAdmin,
  query: FinancialPeriodQuery
): Promise<FinancialCharts> {
  const { from, to } = resolveFinancialPeriod(query)
  const rows = await fetchTransactionsInPeriod(supabase, from, to)

  const byMonthCents = new Map<string, { income: number; expense: number }>()
  for (const month of monthsBetween(from, to)) {
    byMonthCents.set(month, { income: 0, expense: 0 })
  }

  const expenseByCategoryCents = new Map<string, number>()
  const contributionCents = new Map<string, number>()

  for (const row of rows) {
    const cents = toCents(row.amount)
    const month = row.occurred_at.slice(0, 7)

    const bucket = byMonthCents.get(month) ?? { income: 0, expense: 0 }
    if (row.direction === "entrada") {
      bucket.income += cents
    } else {
      bucket.expense += cents
      expenseByCategoryCents.set(row.category, (expenseByCategoryCents.get(row.category) ?? 0) + cents)
    }
    byMonthCents.set(month, bucket)

    if (row.partner_id) {
      contributionCents.set(row.partner_id, (contributionCents.get(row.partner_id) ?? 0) + cents)
    }
  }

  const incomeExpenseByMonth = [...byMonthCents.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, cents]) => ({ month, income: fromCents(cents.income), expense: fromCents(cents.expense) }))

  const expenseByCategory = [...expenseByCategoryCents.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([category, cents]) => ({ category, amount: fromCents(cents) }))

  const partnerNames =
    admin.role === "super_admin"
      ? await resolvePartnerNames([...contributionCents.keys()])
      : new Map<string, string | null>()

  const contributionByPartner = [...contributionCents.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([partnerId, cents]) => ({
      partnerId,
      partnerName: partnerNames.get(partnerId) ?? null,
      amount: fromCents(cents),
    }))

  return { from, to, incomeExpenseByMonth, expenseByCategory, contributionByPartner }
}
