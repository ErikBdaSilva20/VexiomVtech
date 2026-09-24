import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { CaseImage } from "@/components/cases/case-image"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Cases do painel — Vexiom",
  robots: { index: false, follow: false },
}

type CaseRow = Database["public"]["Tables"]["cases"]["Row"]
type AdminCase = Pick<
  CaseRow,
  "id" | "title" | "slug" | "category" | "cover_image_url" | "published" |
  "is_founder_project" | "display_order" | "updated_at"
>

const PAGE_SIZE = 18

function pageHref(page: number) {
  return page === 1 ? "/painel-8f2k/cases" : "/painel-8f2k/cases?page=" + page
}

export default async function AdminCasesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const rawPage = (await searchParams).page
  const requested = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage)
  const page = Number.isSafeInteger(requested) && requested > 0 && requested <= 10000
    ? requested
    : 1

  let cases: AdminCase[] = []
  let total = 0
  let failed = false
  try {
    const supabase = await createClient()
    const from = (page - 1) * PAGE_SIZE
    const { data, count, error } = await supabase
      .from("cases")
      .select("id,title,slug,category,cover_image_url,published,is_founder_project,display_order,updated_at", { count: "exact" })
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    cases = data ?? []
    total = count ?? 0
  } catch (error) {
    console.error("AdminCasesPage: failed to load cases", error)
    failed = true
  }
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <main className="min-h-screen bg-[#111210] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="cases" />
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Portfólio</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Cases</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">Organize os projetos do portfólio e acompanhe o que está publicado.</p>
          </div>
          <Link href="/painel-8f2k/cases/novo" className="inline-flex min-h-11 items-center rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510] hover:bg-[#ffe45d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">+ Novo case</Link>
        </header>

        {failed ? (
          <div role="alert" className="rounded-xl border border-red-900/70 bg-red-950/30 p-5 text-sm text-red-200">Não foi possível carregar os cases. Tente atualizar a página.</div>
        ) : cases.length === 0 ? (
          <section className="rounded-xl border border-dashed border-[#3a3b37] bg-[#181916] px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-white">Nenhum case cadastrado</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#aaa]">O primeiro case pode ser preparado como rascunho antes de aparecer no site.</p>
            <Link href="/painel-8f2k/cases/novo" className="mt-5 inline-flex min-h-11 items-center rounded-md border border-[#6c6230] px-5 text-sm font-semibold text-[#fbd020] hover:border-[#fbd020]">Preparar um case</Link>
          </section>
        ) : (
          <>
            <p className="mb-4 text-sm text-[#aaa]">{total === 1 ? "1 case cadastrado" : total + " cases cadastrados"}</p>
            <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 xl:grid-cols-3">
              {cases.map((item) => (
                <li key={item.id} className="min-w-0 overflow-hidden rounded-xl border border-[#292b28] bg-[#181916]">
                  <article className="flex h-full flex-col">
                    <CaseImage src={item.cover_image_url} title={item.title} />
                    <div className="flex flex-1 flex-col p-5">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className={item.published ? "rounded-full border border-emerald-800 bg-emerald-950/50 px-2.5 py-1 text-emerald-300" : "rounded-full border border-[#50514a] bg-[#252622] px-2.5 py-1 text-[#b8bab2]"}>
                          {item.published ? "Publicado" : "Rascunho"}
                        </span>
                        <span className="text-[#96978f]">Ordem {item.display_order}</span>
                      </div>
                      <h2 className="mt-3 break-words text-lg font-semibold text-white">{item.title}</h2>
                      <p className="mt-1 text-sm text-[#aaa]">{item.category}</p>
                      {item.is_founder_project && <p className="mt-2 text-xs text-[#d6ca97]">Projeto anterior à Vexiom</p>}
                      <Link prefetch={false} href={"/painel-8f2k/cases/" + item.id + "/editar"} className="mt-5 inline-flex min-h-10 items-center self-start text-sm font-semibold text-[#fbd020] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]">Abrir editor <span aria-hidden="true" className="ml-2">→</span></Link>
                    </div>
                  </article>
                </li>
              ))}
            </ul>

            {totalPages > 1 && (
              <nav aria-label="Páginas de cases do painel" className="mt-8 flex items-center justify-center gap-3 text-sm">
                {page > 1 && <Link href={pageHref(page - 1)} className="rounded-md border border-[#3a3b37] px-4 py-2 text-[#ddd] hover:border-[#fbd020]">← Anterior</Link>}
                <span className="text-[#aaa]">Página {page} de {totalPages}</span>
                {page < totalPages && <Link href={pageHref(page + 1)} className="rounded-md border border-[#3a3b37] px-4 py-2 text-[#ddd] hover:border-[#fbd020]">Próxima →</Link>}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}
