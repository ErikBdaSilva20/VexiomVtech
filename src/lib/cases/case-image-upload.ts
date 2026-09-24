import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

const BUCKET = "case-images"
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024
const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
}

export type UploadCaseImageResult = { ok: true; url: string } | { ok: false; error: string }

function validateImageFile(file: File): string | null {
  if (file.size === 0) return "Nenhum arquivo selecionado."
  if (file.size > MAX_FILE_SIZE_BYTES) return "A imagem deve ter no máximo 5MB."
  if (!(file.type in EXTENSION_BY_MIME_TYPE)) return "Formato inválido. Envie PNG, JPG ou WebP."
  return null
}

/**
 * Uploads one image to the `case-images` bucket (FR28/4.2) and returns its
 * public URL. Storage RLS (`case_images_super_admin_write`) is the real
 * enforcement layer, so this must run with the session-aware client, never
 * the service-role client — an `employer` or anon caller gets rejected by
 * the bucket policy itself, not just by the Server Action's own role check.
 *
 * The stored object name never uses the client-supplied filename (avoids
 * path-traversal/collision concerns) — just a random id with an extension
 * derived from the validated MIME type.
 */
export async function uploadCaseImage(
  supabase: SupabaseClient<Database>,
  caseId: string,
  file: File
): Promise<UploadCaseImageResult> {
  const validationError = validateImageFile(file)
  if (validationError) return { ok: false, error: validationError }

  const extension = EXTENSION_BY_MIME_TYPE[file.type]
  const path = `${caseId}/${crypto.randomUUID()}.${extension}`

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  })

  if (error) {
    console.error("uploadCaseImage: failed to upload", error)
    return { ok: false, error: "Não foi possível enviar a imagem." }
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return { ok: true, url: data.publicUrl }
}
