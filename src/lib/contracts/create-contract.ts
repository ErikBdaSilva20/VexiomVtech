import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { CreateContractInput } from "@/lib/contracts/contract-schema"
import { classifyWriteContractError, type WriteContractErrorKind } from "@/lib/contracts/write-contract-error"
import type { Database } from "@/lib/supabase/database.types"

const BUCKET = "contracts"

export type CreateContractResult =
  | { ok: true; id: string }
  | { ok: false; error: WriteContractErrorKind | "upload_failed" }

/**
 * Records a closed contract (metadata always; file optional). When
 * `encryptedFile` is present, it is uploaded to the private `contracts`
 * bucket under a random object name *before* the row is inserted — if the
 * upload fails, no row is inserted at all (per the spec's I/O matrix: "Upload
 * failure after encryption → no row inserted, user-facing error"). The
 * caller (the Server Action) is responsible for encrypting the buffer via
 * `encryptContractFile` beforehand — this function only ever writes what
 * it's given, never plaintext.
 *
 * `created_by` is passed in explicitly rather than read from `input`, same
 * rationale as `createTransaction` — a caller has no way to attribute a
 * contract to a different admin.
 */
export async function createContract(
  supabase: SupabaseClient<Database>,
  input: CreateContractInput,
  createdBy: string,
  encryptedFile?: Buffer
): Promise<CreateContractResult> {
  let fileObjectPath: string | null = null

  if (encryptedFile) {
    fileObjectPath = `${crypto.randomUUID()}.bin`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(fileObjectPath, encryptedFile, {
      contentType: "application/octet-stream",
      upsert: false,
    })

    if (uploadError) {
      console.error("createContract: failed to upload encrypted file", uploadError)
      return { ok: false, error: "upload_failed" }
    }
  }

  const { data, error } = await supabase
    .from("contracts")
    .insert({ ...input, file_object_path: fileObjectPath, created_by: createdBy })
    .select("id")
    .single()

  if (error || !data) {
    console.error("createContract: failed to insert contract", error)

    if (fileObjectPath) {
      const { error: removeError } = await supabase.storage.from(BUCKET).remove([fileObjectPath])
      if (removeError) {
        console.error("createContract: failed to clean up orphaned upload", fileObjectPath, removeError)
      }
    }

    return { ok: false, error: classifyWriteContractError(error) }
  }

  return { ok: true, id: data.id }
}
