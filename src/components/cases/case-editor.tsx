"use client"

import Link from "next/link"
import { useState } from "react"

import { CaseImage } from "@/components/cases/case-image"
import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
} from "@/components/forms/form"

export type EditableCase = {
  id: string
  title: string
  slug: string
  category: string
  client_name: string | null
  is_founder_project: boolean
  project_id: string | null
  cover_image_url: string | null
  gallery_urls: string[] | null
  external_link: string | null
  description: string
  tech_stack: string[] | null
  problem_solved: string
  motivation: string
  published: boolean
  display_order: number
}

export type ProjectOption = { id: string; title: string }

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export function CaseEditor({
  initial,
  projects,
}: {
  initial?: EditableCase
  projects: ProjectOption[]
}) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [slug, setSlug] = useState(initial?.slug ?? "")
  const [slugTouched, setSlugTouched] = useState(Boolean(initial))
  const [category, setCategory] = useState(initial?.category ?? "")
  const [published, setPublished] = useState(initial?.published ?? false)
  const [founderProject, setFounderProject] = useState(initial?.is_founder_project ?? false)
  const [coverName, setCoverName] = useState("")
  const [galleryCount, setGalleryCount] = useState(0)

  function updateTitle(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
      <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-8">
        <p role="status" className="mb-7 rounded-md border border-[#62532c] bg-[#2a2517] p-4 text-sm leading-6 text-[#e6d9a9]">
          Prévia do editor. O salvamento e o envio de imagens serão ativados quando a integração de cases estiver disponível.
        </p>

        <Form onSubmit={(event) => event.preventDefault()} className="gap-8">
          <section aria-labelledby="case-identity-title" className="space-y-5">
            <div>
              <h2 id="case-identity-title" className="text-lg font-semibold text-white">Identificação</h2>
              <p className="mt-1 text-xs text-[#999]">Nome, endereço e categoria que aparecerão no portfólio.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="case-title" label="Nome do projeto *" className="sm:col-span-2">
                <FormInput id="case-title" name="title" maxLength={200} value={title} onChange={(event) => updateTitle(event.target.value)} required />
              </FormField>
              <FormField htmlFor="case-slug" label="Endereço (slug) *" hint="Gerado a partir do nome; ajuste se precisar.">
                <FormInput id="case-slug" name="slug" maxLength={200} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value) }} required />
              </FormField>
              <FormField htmlFor="case-category" label="Categoria *">
                <FormInput id="case-category" name="category" maxLength={200} placeholder="Ex.: Sistema sob medida" value={category} onChange={(event) => setCategory(event.target.value)} required />
              </FormField>
              <FormField htmlFor="case-client" label="Cliente">
                <FormInput id="case-client" name="client_name" maxLength={200} defaultValue={initial?.client_name ?? ""} />
              </FormField>
              <FormField htmlFor="case-project" label="Projeto interno vinculado">
                <FormSelect id="case-project" name="project_id" defaultValue={initial?.project_id ?? ""}>
                  <option value="">Nenhum vínculo</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                </FormSelect>
              </FormField>
            </div>
          </section>

          <section aria-labelledby="case-story-title" className="space-y-5 border-t border-[#292b28] pt-7">
            <h2 id="case-story-title" className="text-lg font-semibold text-white">História do projeto</h2>
            <FormField htmlFor="case-description" label="Descrição detalhada *">
              <FormTextarea id="case-description" name="description" rows={6} maxLength={5000} defaultValue={initial?.description ?? ""} required />
            </FormField>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="case-solution" label="O que o projeto resolveu *">
                <FormTextarea id="case-solution" name="problem_solved" rows={5} maxLength={5000} defaultValue={initial?.problem_solved ?? ""} required />
              </FormField>
              <FormField htmlFor="case-motivation" label="Por que foi construído *">
                <FormTextarea id="case-motivation" name="motivation" rows={5} maxLength={5000} defaultValue={initial?.motivation ?? ""} required />
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="case-stack" label="Tecnologias" hint="Separe as tecnologias por vírgula.">
                <FormInput id="case-stack" name="tech_stack" defaultValue={(initial?.tech_stack ?? []).join(", ")} placeholder="Ex.: Next.js, Supabase" />
              </FormField>
              <FormField htmlFor="case-link" label="Link do projeto">
                <FormInput id="case-link" name="external_link" type="url" defaultValue={initial?.external_link ?? ""} placeholder="https://..." />
              </FormField>
            </div>
          </section>

          <section aria-labelledby="case-media-title" className="space-y-5 border-t border-[#292b28] pt-7">
            <div>
              <h2 id="case-media-title" className="text-lg font-semibold text-white">Imagens</h2>
              <p className="mt-1 text-xs text-[#999]">Selecione uma capa e, se quiser, imagens para a galeria.</p>
            </div>
            <FormField htmlFor="case-cover" label="Imagem de capa" hint={coverName ? "Selecionada: " + coverName : "PNG, JPG ou WebP."}>
              <FormInput id="case-cover" name="cover_image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setCoverName(event.target.files?.[0]?.name ?? "")} />
            </FormField>
            <FormField htmlFor="case-gallery" label="Galeria" hint={galleryCount ? galleryCount + (galleryCount === 1 ? " imagem selecionada" : " imagens selecionadas") : "Selecione quantas imagens precisar."}>
              <FormInput id="case-gallery" name="gallery_images" type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={(event) => setGalleryCount(event.target.files?.length ?? 0)} />
            </FormField>
            {(initial?.gallery_urls?.length ?? 0) > 0 && (
              <div>
                <p className="mb-3 text-xs text-[#999]">Imagens já cadastradas</p>
                <ul className="grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3">
                  {initial?.gallery_urls?.map((url, index) => (
                    <li key={url + index}><CaseImage src={url} title={title + " — imagem " + (index + 1)} /></li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section aria-labelledby="case-publication-title" className="space-y-5 border-t border-[#292b28] pt-7">
            <h2 id="case-publication-title" className="text-lg font-semibold text-white">Publicação</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="case-order" label="Ordem no portfólio" hint="Número menor aparece primeiro.">
                <FormInput id="case-order" name="display_order" type="number" min={0} step={1} defaultValue={initial?.display_order ?? 0} />
              </FormField>
              <div className="space-y-4 self-end">
                <label className="flex min-h-10 items-center gap-3 text-sm text-[#e0e0d9]">
                  <input type="checkbox" name="is_founder_project" checked={founderProject} onChange={(event) => setFounderProject(event.target.checked)} className="size-4 accent-[#fbd020]" />
                  Projeto anterior à Vexiom
                </label>
                <label className="flex min-h-10 items-center gap-3 text-sm text-[#e0e0d9]">
                  <input type="checkbox" name="published" checked={published} onChange={(event) => setPublished(event.target.checked)} className="size-4 accent-[#fbd020]" />
                  Publicado no site
                </label>
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-[#292b28] pt-6 sm:flex-row sm:items-center">
            <Link href="/painel-8f2k/cases" className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-[#fbd020]">Voltar à lista</Link>
            <FormSubmitButton disabled className="mt-0 w-full self-stretch sm:w-auto sm:min-w-[200px] sm:self-auto">Salvar case</FormSubmitButton>
          </div>
        </Form>
      </div>

      <aside className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Prévia</p>
        <div className="mt-4"><CaseImage src={initial?.cover_image_url ?? null} title={title || "Novo projeto"} /></div>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[#4d4e46] px-2.5 py-1 text-[#bbb]">{published ? "Publicado" : "Rascunho"}</span>
          {founderProject && <span className="rounded-full border border-[#5d5125] px-2.5 py-1 text-[#ded29f]">Projeto anterior à Vexiom</span>}
        </div>
        <h2 className="mt-4 break-words text-lg font-semibold text-white">{title || "Nome do projeto"}</h2>
        <p className="mt-1 text-sm text-[#aaa]">{category || "Categoria"}</p>
        <p className="mt-5 text-xs leading-5 text-[#85867f]">Esta prévia usa os dados em edição. O site público mostra somente cases publicados e salvos.</p>
      </aside>
    </div>
  )
}
