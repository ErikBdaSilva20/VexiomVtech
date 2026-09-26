import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { ProjectEditor } from "@/components/projects/project-editor"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"

import { loadProjectLeadOptions } from "../lead-options"

export const metadata: Metadata = {
  title: "Projeto interno - Vexiom",
  robots: { index: false, follow: false },
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()

  const supabase = await createClient()
  const [projectResult, caseResult, transactionResult, leads] = await Promise.all([
    supabase
      .from("projects")
      .select("id,title,client_name,lead_id,status,started_at,finished_at")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("cases")
      .select("id,title,slug,published")
      .eq("project_id", id)
      .order("display_order", { ascending: true }),
    supabase
      .from("financial_transactions")
      .select("id", { count: "exact", head: true })
      .eq("project_id", id),
    loadProjectLeadOptions(supabase),
  ])
  if (projectResult.error) {
    console.error("ProjectDetailPage: failed to load project", projectResult.error)
    throw new Error("Não foi possível carregar o projeto.")
  }
  if (!projectResult.data) notFound()
  if (caseResult.error) console.error("ProjectDetailPage: failed to load cases", caseResult.error)
  if (transactionResult.error) console.error("ProjectDetailPage: failed to count transactions", transactionResult.error)

  const project = projectResult.data
  const linkedCases = caseResult.data ?? []
  const transactionCount = transactionResult.error ? null : transactionResult.count

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="projects" />
        <Link href="/painel-8f2k/projetos" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]"><span aria-hidden="true">←</span> Voltar aos projetos</Link>
        <header className="mb-7 mt-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Projeto interno</p>
          <h1 className="break-words text-3xl font-semibold tracking-tight text-white sm:text-4xl">{project.title}</h1>
          <p className="mt-2 text-sm text-[#aaa]">{project.client_name ?? "Cliente não informado"}</p>
        </header>

        <section aria-label="Resumo do projeto" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5">
            <p className="text-xs text-[#aaa]">Lucro do projeto</p>
            <p className="mt-2 text-2xl font-semibold text-white">{transactionCount === 0 ? "R$ 0,00" : "-"}</p>
            {transactionCount !== 0 && <p className="mt-1 text-xs text-[#85867f]">Consolidado ainda indisponível</p>}
          </div>
          <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5">
            <p className="text-xs text-[#aaa]">Lançamentos vinculados</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{transactionCount ?? "-"}</p>
            <Link href={"/painel-8f2k/financeiro?project_id=" + project.id} className="mt-2 inline-flex text-xs font-semibold text-[#fbd020] hover:underline">Ver financeiro →</Link>
          </div>
          <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5">
            <p className="text-xs text-[#aaa]">Cases vinculados</p>
            <p className="mt-2 text-2xl font-semibold tabular-nums text-white">{caseResult.error ? "-" : linkedCases.length}</p>
            {project.lead_id && <Link prefetch={false} href={"/painel-8f2k/leads/" + project.lead_id} className="mt-2 inline-flex text-xs font-semibold text-[#fbd020] hover:underline">Abrir lead relacionado →</Link>}
          </div>
        </section>

        <ProjectEditor initial={project} leads={leads} />

        {linkedCases.length > 0 && (
          <section aria-labelledby="project-cases-title" className="mt-8 rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
            <h2 id="project-cases-title" className="text-lg font-semibold text-white">Cases deste projeto</h2>
            <ul className="mt-4 list-none divide-y divide-[#292b28] p-0">
              {linkedCases.map((item) => (
                <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <span className="text-sm text-[#ddd]">{item.title} <span className="text-xs text-[#92938d]">· {item.published ? "Publicado" : "Rascunho"}</span></span>
                  <Link prefetch={false} href={"/painel-8f2k/cases/" + (item.slug || item.id) + "/editar"} className="text-xs font-semibold text-[#fbd020] hover:underline">Abrir case →</Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  )
}
