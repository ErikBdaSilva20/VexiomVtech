"use client"

import Link from "next/link"
import { useActionState, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { CaseImage } from "@/components/cases/case-image"
import { createCaseAction, updateCaseAction } from "@/app/painel-8f2k/cases/actions"
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

const MAX_IMAGE_BYTES = 5 * 1024 * 1024
const ACCEPTED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"])

function validateImage(file: File | null) {
  if (!file) return undefined
  if (file.size > MAX_IMAGE_BYTES) return "A imagem deve ter no máximo 5MB."
  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) return "Envie uma imagem PNG, JPG ou WebP."
  return undefined
}

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
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [galleryFile, setGalleryFile] = useState<File | null>(null)
  const router = useRouter()
  const [createState, createAction, createPending] = useActionState(createCaseAction, undefined)
  const [updateState, updateAction, updatePending] = useActionState(updateCaseAction, undefined)
  const state = initial ? updateState : createState
  const pending = initial ? updatePending : createPending
  const fieldError = (name: string) => state?.status === "error" ? state.fieldErrors?.[name]?.[0] : undefined
  const imageFieldError = (name: string) => state?.status === "success" ? state.imageErrors?.[name]?.[0] : undefined
  const coverError = validateImage(coverFile)
  const galleryError = validateImage(galleryFile)

  useEffect(() => {
    if (updateState?.status === "success") router.refresh()
  }, [router, updateState])

  function updateTitle(value: string) {
    setTitle(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  if (!initial && createState?.status === "success") {
    return (
      <section role="status" className="rounded-xl border border-emerald-900/70 bg-emerald-950/30 p-6 sm:p-8">
        <p className="text-sm font-semibold text-emerald-300">Case criado como rascunho</p>
        <h2 className="mt-2 text-xl font-semibold text-white">O projeto foi salvo.</h2>
        <p className="mt-2 text-sm leading-6 text-[#b7b8b2]">Revise os dados e publique quando estiver pronto.</p>
        {createState.imageErrors && (
          <p role="alert" className="mt-4 rounded-md border border-amber-900/60 bg-amber-950/20 px-4 py-3 text-sm text-amber-200">
            Os dados foram salvos, mas algumas imagens falharam: {Object.values(createState.imageErrors).flat().join(" ")} Tente reenviá-las na edição.
          </p>
        )}
        <Link href={"/painel-8f2k/cases/" + createState.id + "/editar"} className="mt-5 inline-flex min-h-11 items-center rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510] hover:bg-[#ffe45d]">
          Continuar edição
        </Link>
      </section>
    )
  }

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.7fr)]">
      <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-8">
        <p className="mb-7 rounded-md border border-[#62532c] bg-[#2a2517] p-4 text-sm leading-6 text-[#e6d9a9]">
          Salve os dados e, se quiser, envie uma capa e uma imagem da galeria por vez. Cada imagem pode ter até 5MB.
        </p>

        <Form action={initial ? updateAction : createAction} aria-busy={pending} className="gap-8">
          {initial && <input type="hidden" name="case_id" value={initial.id} />}
          {state?.status === "error" && <p role="alert" className="rounded-md border border-red-900/70 bg-red-950/30 px-4 py-3 text-sm text-red-200">{state.error}</p>}
          {state?.status === "success" && <p role="status" className="rounded-md border border-emerald-900/70 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-300">
            {state.imageErrors ? "Dados salvos; confira os erros de imagem abaixo." : "Case atualizado com sucesso."}
          </p>}
          <section aria-labelledby="case-identity-title" className="space-y-5">
            <div>
              <h2 id="case-identity-title" className="text-lg font-semibold text-white">Identificação</h2>
              <p className="mt-1 text-xs text-[#999]">Nome, endereço e categoria que aparecerão no portfólio.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="case-title" label="Nome do projeto *" className="sm:col-span-2" error={fieldError("title")}>
                <FormInput id="case-title" name="title" maxLength={200} value={title} onChange={(event) => updateTitle(event.target.value)} required aria-invalid={Boolean(fieldError("title"))} />
              </FormField>
              <FormField htmlFor="case-slug" label="Endereço (slug) *" hint="Gerado a partir do nome; ajuste se precisar." error={fieldError("slug")}>
                <FormInput id="case-slug" name="slug" maxLength={200} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={slug} onChange={(event) => { setSlugTouched(true); setSlug(event.target.value) }} required aria-invalid={Boolean(fieldError("slug"))} />
              </FormField>
              <FormField htmlFor="case-category" label="Categoria *" error={fieldError("category")}>
                <FormInput id="case-category" name="category" maxLength={200} placeholder="Ex.: Sistema sob medida" value={category} onChange={(event) => setCategory(event.target.value)} required aria-invalid={Boolean(fieldError("category"))} />
              </FormField>
              <FormField htmlFor="case-client" label="Cliente" error={fieldError("client_name")}>
                <FormInput id="case-client" name="client_name" maxLength={200} defaultValue={initial?.client_name ?? ""} aria-invalid={Boolean(fieldError("client_name"))} />
              </FormField>
              <FormField htmlFor="case-project" label="Projeto interno vinculado" error={fieldError("project_id")}>
                <FormSelect id="case-project" name="project_id" defaultValue={initial?.project_id ?? ""} aria-invalid={Boolean(fieldError("project_id"))}>
                  <option value="">Nenhum vínculo</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                </FormSelect>
              </FormField>
            </div>
          </section>

          <section aria-labelledby="case-story-title" className="space-y-5 border-t border-[#292b28] pt-7">
            <h2 id="case-story-title" className="text-lg font-semibold text-white">História do projeto</h2>
            <FormField htmlFor="case-description" label="Situação do projeto *" hint="Descreva o contexto, o desafio e o que estava acontecendo antes." error={fieldError("description")}>
              <FormTextarea id="case-description" name="description" rows={6} maxLength={5000} defaultValue={initial?.description ?? ""} required aria-invalid={Boolean(fieldError("description"))} />
            </FormField>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="case-solution" label="O que fizemos *" hint="Explique a solução construída e as principais decisões." error={fieldError("problem_solved")}>
                <FormTextarea id="case-solution" name="problem_solved" rows={5} maxLength={5000} defaultValue={initial?.problem_solved ?? ""} required aria-invalid={Boolean(fieldError("problem_solved"))} />
              </FormField>
              <FormField htmlFor="case-motivation" label="Resultado gerado *" hint="Registre o impacto alcançado, de preferência com números ou evidências." error={fieldError("motivation")}>
                <FormTextarea id="case-motivation" name="motivation" rows={5} maxLength={5000} defaultValue={initial?.motivation ?? ""} required aria-invalid={Boolean(fieldError("motivation"))} />
              </FormField>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="case-stack" label="Tecnologias" hint="Separe as tecnologias por vírgula." error={fieldError("tech_stack")}>
                <FormInput id="case-stack" name="tech_stack" defaultValue={(initial?.tech_stack ?? []).join(", ")} placeholder="Ex.: Next.js, Supabase" aria-invalid={Boolean(fieldError("tech_stack"))} />
              </FormField>
              <FormField htmlFor="case-link" label="Link do projeto" error={fieldError("external_link")}>
                <FormInput id="case-link" name="external_link" type="url" defaultValue={initial?.external_link ?? ""} placeholder="https://..." aria-invalid={Boolean(fieldError("external_link"))} />
              </FormField>
            </div>
          </section>

          <section aria-labelledby="case-media-title" className="space-y-5 border-t border-[#292b28] pt-7">
            <div>
              <h2 id="case-media-title" className="text-lg font-semibold text-white">Imagens</h2>
              <p className="mt-1 text-xs text-[#999]">Adicione uma capa e uma imagem da galeria por salvamento. Para ampliar a galeria, salve novamente.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="case-cover" label="Imagem de capa" hint={coverFile ? "Selecionada: " + coverFile.name : "PNG, JPG ou WebP · até 5MB."} error={coverError ?? imageFieldError("cover_image")}>
                <FormInput id="case-cover" name="cover_image" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)} aria-invalid={Boolean(coverError ?? imageFieldError("cover_image"))} />
              </FormField>
              <FormField htmlFor="case-gallery" label="Adicionar à galeria" hint={galleryFile ? "Selecionada: " + galleryFile.name : "Uma imagem por salvamento · até 5MB."} error={galleryError ?? imageFieldError("gallery_images")}>
                <FormInput id="case-gallery" name="gallery_images" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setGalleryFile(event.target.files?.[0] ?? null)} aria-invalid={Boolean(galleryError ?? imageFieldError("gallery_images"))} />
              </FormField>
            </div>
            {initial?.cover_image_url && (
              <div>
                <p className="mb-3 text-xs text-[#999]">Capa atual</p>
                <div className="max-w-sm"><CaseImage src={initial.cover_image_url} title={title + " — capa"} /></div>
              </div>
            )}
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
              <FormField htmlFor="case-order" label="Ordem no portfólio" hint="Número menor aparece primeiro." error={fieldError("display_order")}>
                <FormInput id="case-order" name="display_order" type="number" min={0} step={1} defaultValue={initial?.display_order ?? 0} aria-invalid={Boolean(fieldError("display_order"))} />
              </FormField>
              <div className="space-y-4 self-end">
                <label className="flex min-h-10 items-center gap-3 text-sm text-[#e0e0d9]">
                  <input type="checkbox" name="is_founder_project" checked={founderProject} onChange={(event) => setFounderProject(event.target.checked)} className="size-4 accent-[#fbd020]" />
                  Projeto anterior à Vexiom
                </label>
                {initial ? (
                  <label className="flex min-h-10 items-center gap-3 text-sm text-[#e0e0d9]">
                    <input type="checkbox" name="published" checked={published} onChange={(event) => setPublished(event.target.checked)} className="size-4 accent-[#fbd020]" />
                    Publicado no site
                  </label>
                ) : (
                  <p className="text-xs leading-5 text-[#a7a39a]">Cases novos começam como rascunho. Publique depois de salvar.</p>
                )}
              </div>
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-[#292b28] pt-6 sm:flex-row sm:items-center">
            <Link href="/painel-8f2k/cases" className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-[#fbd020]">Voltar à lista</Link>
            <FormSubmitButton disabled={pending || Boolean(coverError || galleryError)} className="mt-0 w-full self-stretch sm:w-auto sm:min-w-[200px] sm:self-auto">{pending ? "Salvando..." : "Salvar case"}</FormSubmitButton>
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
