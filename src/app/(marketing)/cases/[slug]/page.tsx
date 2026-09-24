import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { CaseImage, safeExternalCaseUrl } from "@/components/cases/case-image"
import { PageHero } from "@/components/shared/page-hero"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Projeto — Vexiom",
  robots: { index: true, follow: true },
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  if (!slug || slug.length > 200) notFound()

  let item
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from("cases")
      .select("slug,title,category,client_name,is_founder_project,cover_image_url,gallery_urls,external_link,description,tech_stack,problem_solved,motivation")
      .eq("slug", slug)
      .eq("published", true)
      .maybeSingle()
    if (error) throw error
    item = data
  } catch (error) {
    console.error("CaseDetailPage: failed to load case", error)
    return (
      <>
        <PageHero eyebrow="Cases" title="Projeto indisponível" />
        <div role="alert" className="mx-auto max-w-5xl px-5 py-12 text-sm text-[#d4b6a6] sm:px-8">
          Não foi possível carregar este projeto agora. <Link href="/cases" className="text-vexiom-yellow underline">Voltar aos cases</Link>.
        </div>
      </>
    )
  }
  if (!item) notFound()

  const externalUrl = safeExternalCaseUrl(item.external_link)
  const stack = item.tech_stack?.filter(Boolean) ?? []

  return (
    <>
      <PageHero
        eyebrow={item.category}
        title={item.title}
        description={item.client_name ? "Projeto para " + item.client_name : "Conheça os detalhes deste projeto."}
      />
      <article className="mx-auto max-w-7xl px-5 pb-20 pt-8 sm:px-8 lg:px-12">
        <Link href="/cases" className="inline-flex min-h-10 items-center gap-2 text-sm text-[#b0b2ac] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vexiom-yellow">
          <span aria-hidden="true">←</span> Voltar aos cases
        </Link>

        {item.is_founder_project && (
          <aside className="mt-6 rounded-lg border border-[#5d5125] bg-[#242114] p-4 text-sm leading-6 text-[#e6ddb6]">
            Este projeto foi realizado pelo fundador antes da criação da Vexiom. Ele faz parte da experiência que trouxe para a empresa.
          </aside>
        )}

        <div className="mt-6">
          <CaseImage src={item.cover_image_url} title={item.title} eager sizes="(max-width: 1280px) 100vw, 1280px" />
        </div>

        <div className="mt-10 grid grid-cols-1 items-start gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(260px,0.65fr)]">
          <div className="space-y-10">
            <section aria-labelledby="case-about">
              <h2 id="case-about" className="text-2xl font-semibold text-white">Sobre o projeto</h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[#b7b9b3] sm:text-base">{item.description}</p>
            </section>
            <section aria-labelledby="case-solution" className="border-t border-[#292b28] pt-8">
              <h2 id="case-solution" className="text-2xl font-semibold text-white">O que resolvemos</h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[#b7b9b3] sm:text-base">{item.problem_solved}</p>
            </section>
            <section aria-labelledby="case-motivation" className="border-t border-[#292b28] pt-8">
              <h2 id="case-motivation" className="text-2xl font-semibold text-white">Por que construímos</h2>
              <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-[#b7b9b3] sm:text-base">{item.motivation}</p>
            </section>
          </div>

          <aside className="rounded-lg border border-[#292b28] bg-[#151615] p-5 sm:p-6">
            <h2 className="text-lg font-semibold text-white">Ficha do projeto</h2>
            <dl className="mt-5 space-y-4 text-sm">
              <div><dt className="text-xs text-[#85867f]">Categoria</dt><dd className="mt-1 text-[#e5e5df]">{item.category}</dd></div>
              {item.client_name && <div><dt className="text-xs text-[#85867f]">Cliente</dt><dd className="mt-1 text-[#e5e5df]">{item.client_name}</dd></div>}
            </dl>
            {stack.length > 0 && (
              <div className="mt-6 border-t border-[#292b28] pt-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#aaa]">Tecnologias</h3>
                <ul className="mt-3 flex list-none flex-wrap gap-2 p-0">
                  {stack.map((technology) => <li key={technology} className="rounded-full border border-[#41433c] px-3 py-1 text-xs text-[#d2d4cd]">{technology}</li>)}
                </ul>
              </div>
            )}
            <div className="mt-6 flex flex-col gap-3 border-t border-[#292b28] pt-5">
              {externalUrl && (
                <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center justify-center rounded-md border border-[#595a50] px-4 text-sm font-semibold text-white hover:border-vexiom-yellow focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vexiom-yellow">
                  Visitar projeto <span aria-hidden="true" className="ml-2">↗</span>
                </a>
              )}
              <Link href="/contato" className="inline-flex min-h-11 items-center justify-center rounded-md bg-vexiom-yellow px-4 text-sm font-semibold text-[#111] hover:bg-vexiom-yellow-light focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-vexiom-yellow">
                Quero um projeto assim
              </Link>
            </div>
          </aside>
        </div>

        {(item.gallery_urls?.length ?? 0) > 0 && (
          <section aria-labelledby="case-gallery" className="mt-12 border-t border-[#292b28] pt-10">
            <h2 id="case-gallery" className="text-2xl font-semibold text-white">Mais imagens</h2>
            <ul className="mt-6 grid list-none grid-cols-1 gap-4 p-0 md:grid-cols-2">
              {item.gallery_urls?.map((url, index) => (
                <li key={url + index}>
                  <CaseImage src={url} title={item.title + " — imagem " + (index + 1)} sizes="(max-width: 768px) 100vw, 50vw" />
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </>
  )
}
