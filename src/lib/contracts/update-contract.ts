import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import type { UpdateContractInput } from "@/lib/contracts/contract-schema"
import { classifyWriteContractError, type WriteContractErrorKind } from "@/lib/contracts/write-contract-error"
import type { Database } from "@/lib/supabase/database.types"

const BUCKET = "contracts"
export type UpdateContractResult = { ok: true } | { ok: false; error: WriteContractErrorKind | "upload_failed" }

export async function updateContract(supabase: SupabaseClient<Database>, input: UpdateContractInput, encryptedFile?: Buffer): Promise<UpdateContractResult> {
  const { contract_id, remove_file, ...fields } = input
  const { data: current, error: fetchError } = await supabase.from("contracts").select("file_object_path").eq("id", contract_id).single()
  if (fetchError || !current) return { ok: false, error: "unknown" }
  let nextPath = current.file_object_path
  let uploadedPath: string | null = null
  if (encryptedFile) {
    uploadedPath = `${crypto.randomUUID()}.bin`
    const { error } = await supabase.storage.from(BUCKET).upload(uploadedPath, encryptedFile, { contentType: "application/octet-stream", upsert: false })
    if (error) return { ok: false, error: "upload_failed" }
    nextPath = uploadedPath
  } else if (remove_file) nextPath = null
  const { data, error } = await supabase.from("contracts").update({ ...fields, file_object_path: nextPath }).eq("id", contract_id).select("id").single()
  if (error || !data) {
    if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath])
    return { ok: false, error: classifyWriteContractError(error) }
  }
  if (current.file_object_path && current.file_object_path !== nextPath) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([current.file_object_path])
    if (removeError) console.error("updateContract: failed to remove replaced file", removeError)
  }
  return { ok: true }
}
