import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Projetos internos - Vexiom",
  robots: { index: false, follow: false },
}

type Project = Pick<
  Database["public"]["Tables"]["projects"]["Row"],
  "id" | "title" | "client_name" | "lead_id" | "status" |
  "started_at" | "finished_at" | "created_at"
>
const PAGE_SIZE = 20

function pageHref(page: number) {
  return page === 1 ? "/painel-8f2k/projetos" : "/painel-8f2k/projetos?page=" + page
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const rawPage = (await searchParams).page
  const requested = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage)
  const page = Number.isSafeInteger(requested) && requested > 0 && requested <= 10000 ? requested : 1

  let projects: Project[] = []
  let total = 0
  let failed = false
  try {
    const supabase = await createClient()
    const from = (page - 1) * PAGE_SIZE
    const { data, count, error } = await supabase
      .from("projects")
      .select("id,title,client_name,lead_id,status,started_at,finished_at,created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    projects = data ?? []
    total = count ?? 0
  } catch (error) {
    console.error("ProjectsPage: failed to load projects", error)
    failed = true
  }
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="projects" />
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Gestão interna</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Projetos</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">Acompanhe todo trabalho contratado, esteja ou não publicado como case.</p>
          </div>
          <Link href="/painel-8f2k/projetos/novo" className="inline-flex min-h-11 items-center rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510] hover:bg-[#ffe45d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">+ Novo projeto</Link>
        </header>

        {failed ? (
          <div role="alert" className="rounded-xl border border-red-900/70 bg-red-950/30 p-5 text-sm text-red-200">Não foi possível carregar os projetos agora.</div>
        ) : projects.length === 0 ? (
          <section className="rounded-xl border border-dashed border-[#3a3b37] bg-[#181916] px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-white">Nenhum projeto cadastrado</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#aaa]">Projetos internos ajudam a reunir cases e lançamentos financeiros do mesmo trabalho.</p>
            <Link href="/painel-8f2k/projetos/novo" className="mt-5 inline-flex min-h-11 items-center rounded-md border border-[#6c6230] px-5 text-sm font-semibold text-[#fbd020] hover:border-[#fbd020]">Preparar projeto</Link>
          </section>
        ) : (
          <>
            <p className="mb-4 text-sm text-[#aaa]">{total === 1 ? "1 projeto cadastrado" : total + " projetos cadastrados"}</p>
            <ul className="grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
              {projects.map((project) => (
                <li key={project.id} className="min-w-0 rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
                  <article>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h2 className="min-w-0 break-words text-lg font-semibold text-white">
                        <Link prefetch={false} href={"/painel-8f2k/projetos/" + project.id} className="hover:text-[#fbd020] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]">{project.title}</Link>
                      </h2>
                      <span className={project.status === "concluido" ? "rounded-full border border-emerald-800 bg-emerald-950/40 px-2.5 py-1 text-xs text-emerald-300" : project.status === "cancelado" ? "rounded-full border border-[#55534d] px-2.5 py-1 text-xs text-[#aaa]" : "rounded-full border border-[#685b2f] bg-[#2d2919] px-2.5 py-1 text-xs text-[#fbd020]"}>
                        {project.status === "concluido" ? "Concluído" : project.status === "cancelado" ? "Cancelado" : "Em andamento"}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-[#aaa]">{project.client_name ?? "Cliente não informado"}</p>
                    {project.lead_id && <p className="mt-3 text-xs text-[#85867f]">Vinculado a um lead</p>}
                    <Link prefetch={false} href={"/painel-8f2k/projetos/" + project.id} className="mt-5 inline-flex min-h-10 items-center text-sm font-semibold text-[#fbd020] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#fbd020]">Abrir projeto <span aria-hidden="true" className="ml-2">→</span></Link>
                  </article>
                </li>
              ))}
            </ul>
            {totalPages > 1 && (
              <nav aria-label="Páginas de projetos" className="mt-8 flex items-center justify-center gap-3 text-sm">
                {page > 1 && <Link href={pageHref(page - 1)} className="rounded-md border border-[#3a3b37] px-4 py-2 text-[#ddd] hover:border-[#fbd020]">← Anterior</Link>}
                <span className="text-[#aaa]">{page} / {totalPages}</span>
                {page < totalPages && <Link href={pageHref(page + 1)} className="rounded-md border border-[#3a3b37] px-4 py-2 text-[#ddd] hover:border-[#fbd020]">Próxima →</Link>}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}
