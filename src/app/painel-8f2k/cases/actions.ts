"use server"

import { createCase } from "@/lib/cases/create-case"
import { createCaseSchema, updateCaseSchema } from "@/lib/cases/case-schema"
import { uploadCaseImage } from "@/lib/cases/case-image-upload"
import { appendCaseGalleryImages, setCaseCoverImage } from "@/lib/cases/set-case-images"
import { updateCase } from "@/lib/cases/update-case"
import type { WriteCaseErrorKind } from "@/lib/cases/write-case-error"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/supabase/database.types"

const ERROR_MESSAGES: Record<WriteCaseErrorKind, string> = {
  duplicate_slug: "Esse endereço (slug) já está em uso por outro case.",
  invalid_project: "O projeto interno selecionado não existe.",
  unknown: "Não foi possível salvar o case.",
}

// A `FormData` field that's absent (not present as a key at all) arrives as
// `null` — a plain <input> whose value is an empty string still arrives as
// `""`, which schemas here validate normally (most case fields are required).
function textFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key)
  return typeof value === "string" ? value : undefined
}

// Unchecked checkboxes are omitted from FormData entirely — only a checked
// box sends a value (the form uses `"on"` implicitly via the browser default).
function checkboxFormValue(formData: FormData, key: string): boolean {
  return formData.get(key) !== null
}

// Images are best-effort alongside a field save (FR28/4.2): the case row is
// the source of truth and its write already succeeded by the time this
// runs, so an upload hiccup is logged and surfaced back as a field error
// key, but never rolls back or blocks the field save itself — the admin can
// just retry the image from the (now-existing) edit page.
async function applyCaseImages(
  supabase: SupabaseClient<Database>,
  caseId: string,
  formData: FormData
): Promise<Record<string, string[]> | undefined> {
  const fieldErrors: Record<string, string[]> = {}

  const coverImage = formData.get("cover_image")
  if (coverImage instanceof File && coverImage.size > 0) {
    const result = await uploadCaseImage(supabase, caseId, coverImage)
    if (!result.ok) {
      fieldErrors.cover_image = [result.error]
    } else {
      const setResult = await setCaseCoverImage(supabase, caseId, result.url)
      if (!setResult.ok) fieldErrors.cover_image = ["Não foi possível salvar a imagem de capa."]
    }
  }

  const galleryFiles = formData.getAll("gallery_images").filter(
    (value): value is File => value instanceof File && value.size > 0
  )
  if (galleryFiles.length > 0) {
    const uploads = await Promise.all(galleryFiles.map((file) => uploadCaseImage(supabase, caseId, file)))
    const urls = uploads.filter((upload) => upload.ok).map((upload) => upload.url)
    const failures = uploads.filter((upload) => !upload.ok)

    if (urls.length > 0) {
      const appendResult = await appendCaseGalleryImages(supabase, caseId, urls)
      if (!appendResult.ok) fieldErrors.gallery_images = ["Não foi possível salvar as imagens da galeria."]
    }
    if (failures.length > 0) {
      fieldErrors.gallery_images = [
        ...(fieldErrors.gallery_images ?? []),
        `${failures.length} imagem(ns) da galeria não pôde(puderam) ser enviada(s).`,
      ]
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined
}

async function requireSuperAdmin() {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { ok: false as const, error: "Sessão expirada. Faça login novamente." }
  }
  if (admin.role !== "super_admin") {
    return { ok: false as const, error: "Apenas super_admin pode gerenciar cases." }
  }
  return { ok: true as const, admin }
}

export type CreateCaseState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; id: string; imageErrors?: Record<string, string[]> }
  | undefined

export async function createCaseAction(
  _prevState: CreateCaseState,
  formData: FormData
): Promise<CreateCaseState> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { status: "error", error: auth.error }

  const parsed = createCaseSchema.safeParse({
    title: textFormValue(formData, "title"),
    slug: textFormValue(formData, "slug"),
    category: textFormValue(formData, "category"),
    client_name: textFormValue(formData, "client_name"),
    project_id: textFormValue(formData, "project_id"),
    description: textFormValue(formData, "description"),
    problem_solved: textFormValue(formData, "problem_solved"),
    motivation: textFormValue(formData, "motivation"),
    external_link: textFormValue(formData, "external_link"),
    tech_stack: textFormValue(formData, "tech_stack"),
    is_founder_project: checkboxFormValue(formData, "is_founder_project"),
    display_order: textFormValue(formData, "display_order"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      error: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const result = await createCase(supabase, parsed.data)

  if (!result.ok) {
    return { status: "error", error: ERROR_MESSAGES[result.error] }
  }

  const imageErrors = await applyCaseImages(supabase, result.id, formData)

  return { status: "success", id: result.id, imageErrors }
}

export type UpdateCaseState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; imageErrors?: Record<string, string[]> }
  | undefined

export async function updateCaseAction(
  _prevState: UpdateCaseState,
  formData: FormData
): Promise<UpdateCaseState> {
  const auth = await requireSuperAdmin()
  if (!auth.ok) return { status: "error", error: auth.error }

  const parsed = updateCaseSchema.safeParse({
    case_id: textFormValue(formData, "case_id"),
    title: textFormValue(formData, "title"),
    slug: textFormValue(formData, "slug"),
    category: textFormValue(formData, "category"),
    client_name: textFormValue(formData, "client_name"),
    project_id: textFormValue(formData, "project_id"),
    description: textFormValue(formData, "description"),
    problem_solved: textFormValue(formData, "problem_solved"),
    motivation: textFormValue(formData, "motivation"),
    external_link: textFormValue(formData, "external_link"),
    tech_stack: textFormValue(formData, "tech_stack"),
    is_founder_project: checkboxFormValue(formData, "is_founder_project"),
    published: checkboxFormValue(formData, "published"),
    display_order: textFormValue(formData, "display_order"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      error: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const result = await updateCase(supabase, parsed.data)

  if (!result.ok) {
    return { status: "error", error: ERROR_MESSAGES[result.error] }
  }

  const imageErrors = await applyCaseImages(supabase, parsed.data.case_id, formData)

  return { status: "success", imageErrors }
}
