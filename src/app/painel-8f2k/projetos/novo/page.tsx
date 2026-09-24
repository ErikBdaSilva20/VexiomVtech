import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { ProjectEditor } from "@/components/projects/project-editor"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"

import { loadProjectLeadOptions } from "../lead-options"

export const metadata: Metadata = {
  title: "Novo projeto — Vexiom",
  robots: { index: false, follow: false },
}

export default async function NewProjectPage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const leads = await loadProjectLeadOptions(await createClient())

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="projects" />
        <Link href="/painel-8f2k/projetos" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]"><span aria-hidden="true">←</span> Voltar aos projetos</Link>
        <header className="mb-7 mt-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Gestão interna</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Novo projeto</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">Acompanhe um trabalho contratado, com ou sem case publicado.</p>
        </header>
        <ProjectEditor leads={leads} />
      </div>
    </main>
  )
}
