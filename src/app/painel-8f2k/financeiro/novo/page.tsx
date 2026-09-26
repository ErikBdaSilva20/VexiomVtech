import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { FinancialEntryForm } from "@/components/finance/financial-entry-form"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Novo lançamento - Vexiom",
  robots: { index: false, follow: false },
}

export default async function NewFinancialEntryPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const supabase = await createClient()
  const { data: projects, error } = await supabase
    .from("projects")
    .select("id,title")
    .order("title", { ascending: true })
    .limit(500)
  if (error) console.error("NewFinancialEntryPage: failed to load projects", error)

  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(new Date())

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="financeiro" />
        <Link href="/painel-8f2k/financeiro" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]"><span aria-hidden="true">←</span> Voltar ao financeiro</Link>
        <header className="mb-7 mt-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Livro-caixa</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Novo lançamento</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">Organize o movimento por categoria, projeto e fonte de financiamento.</p>
        </header>
        <FinancialEntryForm projects={projects ?? []} adminId={admin.id} adminName={admin.name} today={today} />
      </div>
    </main>
  )
}
