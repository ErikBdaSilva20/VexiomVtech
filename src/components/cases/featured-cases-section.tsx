import Link from "next/link"

import { CaseImage } from "@/components/cases/case-image"
import type { Database } from "@/lib/supabase/database.types"
import { createClient } from "@/lib/supabase/server"

type CaseRow = Database["public"]["Tables"]["cases"]["Row"]
type FeaturedCase = Pick<CaseRow, "slug" | "title" | "category" | "client_name" | "cover_image_url" | "description" | "problem_solved" | "motivation">

export async function FeaturedCasesSection() {
  let cases: FeaturedCase[] = []
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("cases")
      .select("slug,title,category,client_name,cover_image_url,description,problem_solved,motivation")
      .eq("published", true)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(4)
    if (error) throw error
    cases = data ?? []
  } catch (error) {
    console.error("FeaturedCasesSection: failed to load published cases", error)
  }

  return (
    <section className="relative" aria-labelledby="featured-cases-title">
      <div className="mx-auto max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pt-20 lg:px-12">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-vexiom-yellow">Cases da Vexiom</p>
            <h2 id="featured-cases-title" className="mt-3 text-3xl font-semibold tracking-tight text-[#f2f2f0] sm:text-4xl">Projetos reais. Problemas resolvidos.</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#aeb0ab] sm:text-base">Veja alguns dos trabalhos que transformaram problemas reais em experiências digitais mais claras e eficientes.</p>
          </div>
          <Link href="/cases" className="inline-flex min-h-11 items-center rounded-md border border-[#5a5525] px-5 text-sm font-semibold text-vexiom-yellow hover:border-vexiom-yellow hover:bg-[#201f0c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vexiom-yellow">Ver todos os cases <span aria-hidden="true" className="ml-2">↗</span></Link>
        </div>
        {cases.length > 0 ? (
          <ul className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 xl:grid-cols-4">
            {cases.map((item, index) => (
              <li key={item.slug} className="min-w-0 overflow-hidden rounded-lg border border-[#292b28] bg-[#151615]">
                <article className="flex h-full flex-col">
                  <CaseImage src={item.cover_image_url} title={item.title} eager={index === 0} sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw" />
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-semibold uppercase tracking-[0.1em] text-vexiom-yellow">{item.category}</span>
                    <h3 className="mt-3 text-lg font-semibold tracking-tight text-white"><Link prefetch={false} href={"/cases/" + encodeURIComponent(item.slug)} className="rounded-sm hover:text-vexiom-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vexiom-yellow">{item.title}</Link></h3>
                    {item.client_name && <p className="mt-1 text-xs text-[#91938f]">{item.client_name}</p>}
                    <div className="mt-4 space-y-3 text-sm leading-5 text-[#b3b5af]">
                      <p className="line-clamp-2"><span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#aaa]">Situação</span>{item.description}</p>
                      <p className="line-clamp-2"><span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#aaa]">Resultado</span>{item.motivation}</p>
                    </div>
                    <Link prefetch={false} href={"/cases/" + encodeURIComponent(item.slug)} className="mt-4 inline-flex min-h-10 items-center self-start text-sm font-semibold text-vexiom-yellow underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vexiom-yellow">Ver case <span aria-hidden="true" className="ml-2">↗</span></Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        ) : <p className="rounded-lg border border-dashed border-[#3a3b37] bg-[#151615] px-6 py-10 text-center text-sm text-[#a3a5a1]">Nossos primeiros projetos publicados aparecerão aqui em breve.</p>}
      </div>
    </section>
  )
}
