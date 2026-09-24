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

// A browser sets `File.type` from OS/extension sniffing, but nothing stops a
// caller invoking this Server Action directly from sending an arbitrary
// Blob with a spoofed `type` — since the object is written back with that
// same type as its Content-Type into a *public* bucket linked straight from
// the marketing site, checking the real file signature (not just the
// client-asserted MIME type) is worth the extra read before upload.
const MAGIC_BYTES: Record<string, number[]> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // "RIFF" (WEBP marker follows at byte 8, checked separately)
}

async function matchesDeclaredType(file: File): Promise<boolean> {
  const signature = MAGIC_BYTES[file.type]
  if (!signature) return false

  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const signatureMatches = signature.every((byte, index) => header[index] === byte)
  if (!signatureMatches) return false

  if (file.type === "image/webp") {
    const webpMarker = String.fromCharCode(...header.slice(8, 12))
    return webpMarker === "WEBP"
  }

  return true
}

async function validateImageFile(file: File): Promise<string | null> {
  if (file.size === 0) return "Nenhum arquivo selecionado."
  if (file.size > MAX_FILE_SIZE_BYTES) return "A imagem deve ter no máximo 5MB."
  if (!(file.type in EXTENSION_BY_MIME_TYPE)) return "Formato inválido. Envie PNG, JPG ou WebP."
  if (!(await matchesDeclaredType(file))) return "O arquivo não é uma imagem válida no formato declarado."
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
  const validationError = await validateImageFile(file)
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
