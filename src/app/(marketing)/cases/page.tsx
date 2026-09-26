import type { Metadata } from "next"
import Link from "next/link"

import { CaseImage } from "@/components/cases/case-image"
import { PageHero } from "@/components/shared/page-hero"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Cases - Vexiom",
  description:
    "Projetos entregues pela Vexiom: sites, sistemas, lojas online e automações que geraram resultado real.",
}

type CaseRow = Database["public"]["Tables"]["cases"]["Row"]
type PublicCase = Pick<
  CaseRow,
  | "slug"
  | "title"
  | "category"
  | "client_name"
  | "is_founder_project"
  | "cover_image_url"
  | "description"
>

const PAGE_SIZE = 9

function pageHref(page: number) {
  return page === 1 ? "/cases" : "/cases?page=" + page
}

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const rawPage = (await searchParams).page
  const requested = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage)
  const page = Number.isSafeInteger(requested) && requested > 0 && requested <= 10000
    ? requested
    : 1

  let cases: PublicCase[] = []
  let total = 0
  let failed = false

  try {
    const supabase = await createClient()
    const from = (page - 1) * PAGE_SIZE
    const { data, count, error } = await supabase
      .from("cases")
      .select(
        "slug,title,category,client_name,is_founder_project,cover_image_url,description",
        { count: "exact" }
      )
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    cases = data ?? []
    total = count ?? 0
  } catch (error) {
    console.error("CasesPage: failed to load published cases", error)
    failed = true
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <>
      <PageHero
        eyebrow="Resultados"
        title="Projetos que geram resultado."
        description="Conheça trabalhos publicados pela Vexiom: a situação encontrada, o que foi feito e o resultado gerado."
      />

      <section aria-labelledby="cases-list-title" className="mx-auto max-w-7xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14 lg:px-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vexiom-yellow">Portfólio</p>
            <h2 id="cases-list-title" className="mt-2 text-2xl font-semibold tracking-tight text-[#f2f2f0] sm:text-3xl">Projetos publicados</h2>
          </div>
          {!failed && total > 0 && <p className="text-sm text-[#a3a5a1]">{total === 1 ? "1 projeto" : total + " projetos"}</p>}
        </div>

        {failed ? (
          <div role="alert" className="rounded-lg border border-[#524038] bg-[#241916] p-6 text-sm leading-6 text-[#f1c7b7]">
            Não foi possível carregar os projetos agora. Tente novamente em instantes.
          </div>
        ) : cases.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#3a3b37] bg-[#151615] px-6 py-14 text-center">
            <h3 className="text-lg font-semibold text-[#f1f1ef]">Nenhum case publicado por enquanto</h3>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[#a3a5a1]">
              Quer conversar sobre um projeto? Conte sua ideia e retornaremos pelo canal indicado.
            </p>
            <Link href="/contato" className="mt-5 inline-flex min-h-11 items-center rounded-md bg-vexiom-yellow px-5 text-sm font-semibold text-[#111] hover:bg-vexiom-yellow-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vexiom-yellow">Falar sobre um projeto</Link>
          </div>
        ) : (
          <ul className="grid list-none grid-cols-1 gap-5 p-0 md:grid-cols-2 xl:grid-cols-3">
            {cases.map((item, index) => (
              <li key={item.slug} className="min-w-0 overflow-hidden rounded-lg border border-[#292b28] bg-[#151615]">
                <article className="flex h-full flex-col">
                  <CaseImage src={item.cover_image_url} title={item.title} eager={index === 0} />
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-semibold uppercase tracking-[0.1em] text-vexiom-yellow">{item.category}</span>
                      {item.is_founder_project && <span className="rounded-full border border-[#57513a] px-2.5 py-1 text-[#d8d1a8]">Projeto anterior à Vexiom</span>}
                    </div>
                    <h3 className="mt-3 text-xl font-semibold tracking-tight text-white">
                      <Link prefetch={false} href={"/cases/" + encodeURIComponent(item.slug)} className="rounded-sm hover:text-vexiom-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vexiom-yellow">
                        {item.title}
                      </Link>
                    </h3>
                    {item.client_name && <p className="mt-1 text-xs text-[#91938f]">{item.client_name}</p>}
                    <div className="mt-4 space-y-2 text-sm leading-5 text-[#b3b5af]">
                      <p className="line-clamp-2"><span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#aaa]">Situação</span>{item.description}</p>
                    </div>
                    <Link prefetch={false} href={"/cases/" + encodeURIComponent(item.slug)} className="mt-5 inline-flex min-h-10 items-center self-start text-sm font-semibold text-vexiom-yellow underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vexiom-yellow">
                      Ver case <span aria-hidden="true" className="ml-2">↗</span>
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}

        {!failed && totalPages > 1 && (
          <nav aria-label="Páginas de cases" className="mt-8 flex items-center justify-center gap-3 text-sm">
            {page > 1 && <Link href={pageHref(page - 1)} className="rounded-md border border-[#3a3b37] px-4 py-2 text-[#ddd] hover:border-vexiom-yellow">← Anterior</Link>}
            <span className="text-[#a3a5a1]">Página {page} de {totalPages}</span>
            {page < totalPages && <Link href={pageHref(page + 1)} className="rounded-md border border-[#3a3b37] px-4 py-2 text-[#ddd] hover:border-vexiom-yellow">Próxima →</Link>}
          </nav>
        )}
      </section>
    </>
  )
}
