import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

export type SetCaseImagesResult = { ok: true } | { ok: false }

/**
 * Sets `cover_image_url` (FR28/4.2). `null` clears it; `undefined` leaves it
 * untouched — distinct from `updateCase` (4.1), which always overwrites
 * every field, since a case-editing admin doesn't necessarily re-upload a
 * cover every time they save.
 */
export async function setCaseCoverImage(
  supabase: SupabaseClient<Database>,
  caseId: string,
  coverImageUrl: string
): Promise<SetCaseImagesResult> {
  const { error } = await supabase.from("cases").update({ cover_image_url: coverImageUrl }).eq("id", caseId)

  if (error) {
    console.error("setCaseCoverImage: failed to update", error)
    return { ok: false }
  }

  return { ok: true }
}

/**
 * Appends new gallery URLs to a case's existing `gallery_urls` (FR28/4.2
 * AC: "as URLs são adicionadas a gallery_urls" — additive, not a
 * replacement). Read-then-write, not a single atomic statement — accepted
 * here for the same reason `updateCase` (4.1) skips optimistic concurrency:
 * cases are a single-super_admin-persona resource, not contended between
 * concurrent editors.
 */
export async function appendCaseGalleryImages(
  supabase: SupabaseClient<Database>,
  caseId: string,
  newUrls: string[]
): Promise<SetCaseImagesResult> {
  if (newUrls.length === 0) return { ok: true }

  const { data: existing, error: readError } = await supabase
    .from("cases")
    .select("gallery_urls")
    .eq("id", caseId)
    .single()

  if (readError || !existing) {
    console.error("appendCaseGalleryImages: failed to read existing gallery", readError)
    return { ok: false }
  }

  const gallery_urls = [...(existing.gallery_urls ?? []), ...newUrls]

  const { error: writeError } = await supabase.from("cases").update({ gallery_urls }).eq("id", caseId)

  if (writeError) {
    console.error("appendCaseGalleryImages: failed to update", writeError)
    return { ok: false }
  }

  return { ok: true }
}
