import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"

import { ManualLeadForm } from "./manual-lead-form"

export const metadata: Metadata = {
  title: "Novo lead — Vexiom",
  robots: { index: false, follow: false },
}

export default async function NewLeadPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <AdminNav role={admin.role} active="leads" />
        <Link href="/painel-8f2k/leads" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]">
          <span aria-hidden="true">←</span> Voltar para leads
        </Link>
        <header className="mb-7 mt-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Área administrativa</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Cadastrar lead</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">Adicione um contato recebido fora do formulário do site. Você poderá completar os detalhes e organizar o acompanhamento depois.</p>
        </header>
        <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-8">
          <ManualLeadForm />
        </div>
      </div>
    </main>
  )
}

