import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"

import { ContractForm } from "./contract-form"

export const metadata: Metadata = {
  title: "Novo contrato - Vexiom",
  robots: { index: false, follow: false },
}

export default async function NewContractPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const supabase = await createClient()
  const { data: leads, error } = await supabase
    .from("leads")
    .select("id,name,company")
    .order("name", { ascending: true })
    .limit(500)
  if (error) console.error("NewContractPage: failed to load leads", error)

  const leadOptions = (leads ?? []).map((lead) => ({
    id: lead.id,
    label: lead.company ? lead.name + " · " + lead.company : lead.name,
  }))

  return (
    <main className="min-h-screen bg-[#0c0e0c] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-3xl">
        <AdminNav role={admin.role} active="contracts" />
        <Link href="/painel-8f2k/contratos" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]"><span aria-hidden="true">←</span> Voltar aos contratos</Link>
        <header className="mb-7 mt-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Jurídico</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Novo contrato</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">Registre um contrato fechado e, se quiser, anexe o PDF assinado.</p>
        </header>

        <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-8">
          <ContractForm leads={leadOptions} />
        </div>
      </div>
    </main>
  )
}
