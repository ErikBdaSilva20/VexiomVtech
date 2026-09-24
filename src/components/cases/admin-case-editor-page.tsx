import Link from "next/link"

import { AdminNav } from "@/components/admin/admin-nav"
import { CaseEditor, type EditableCase, type ProjectOption } from "@/components/cases/case-editor"
import type { CurrentAdmin } from "@/lib/auth/get-current-admin"

export function AdminCaseEditorPage({
  admin,
  initial,
  projects,
}: {
  admin: CurrentAdmin
  initial?: EditableCase
  projects: ProjectOption[]
}) {
  const editing = Boolean(initial)

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="cases" />
        <Link href="/painel-8f2k/cases" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]">
          <span aria-hidden="true">←</span> Voltar para cases
        </Link>
        <header className="mb-7 mt-7">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Portfólio</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">{editing ? "Editar case" : "Novo case"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">
            {editing
              ? "Revise a apresentação, as imagens e o estado de publicação deste projeto."
              : "Prepare a história do projeto como rascunho antes de publicá-lo."}
          </p>
        </header>
        <CaseEditor initial={initial} projects={projects} />
      </div>
    </main>
  )
}
