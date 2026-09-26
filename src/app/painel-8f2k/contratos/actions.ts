"use server"

import { createContract } from "@/lib/contracts/create-contract"
import { createContractSchema, updateContractSchema } from "@/lib/contracts/contract-schema"
import { updateContract } from "@/lib/contracts/update-contract"
import { encryptContractFile } from "@/lib/contracts/encrypt-contract-file"
import type { WriteContractErrorKind } from "@/lib/contracts/write-contract-error"
import { requireSuperAdmin } from "@/lib/auth/require-super-admin"
import { textFormValue } from "@/lib/forms/text-form-value"
import { createClient } from "@/lib/supabase/server"

const ERROR_MESSAGES: Record<WriteContractErrorKind | "upload_failed", string> = {
  invalid_lead: "O lead selecionado não existe.",
  invalid_hours: "Horas são obrigatórias para contratos de demanda.",
  invalid_amount: "O valor informado é inválido.",
  upload_failed: "Não foi possível enviar o arquivo do contrato.",
  unknown: "Não foi possível salvar o contrato.",
}

const ROLE_DENIED_MESSAGE = "Apenas super_admin pode gerenciar contratos."
const INVALID_FILE_MESSAGE = "O arquivo deve ser um PDF de até 10MB."

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46] // "%PDF"

export type CreateContractState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; id: string }
  | undefined

export type UpdateContractState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success" }
  | undefined

async function matchesPdfSignature(file: File): Promise<boolean> {
  const header = new Uint8Array(await file.slice(0, PDF_MAGIC_BYTES.length).arrayBuffer())
  return PDF_MAGIC_BYTES.every((byte, index) => header[index] === byte)
}

/**
 * Validates the optional file attachment before any encryption/upload work
 * happens — a wrong-type or oversized file is rejected up front (`invalid_file`
 * in the spec's I/O matrix), same "check the real bytes, not just the
 * client-asserted MIME type" discipline as `case-image-upload.ts`.
 */
async function validateContractFile(file: File): Promise<string | null> {
  if (file.size > MAX_FILE_SIZE_BYTES) return INVALID_FILE_MESSAGE
  if (file.type !== "application/pdf") return INVALID_FILE_MESSAGE
  if (!(await matchesPdfSignature(file))) return INVALID_FILE_MESSAGE
  return null
}

export async function createContractAction(
  _prevState: CreateContractState,
  formData: FormData
): Promise<CreateContractState> {
  const auth = await requireSuperAdmin(ROLE_DENIED_MESSAGE)
  if (!auth.ok) return { status: "error", error: auth.error }

  const serviceTypes = formData.getAll("service_types").filter((value): value is string => typeof value === "string")

  const parsed = createContractSchema.safeParse({
    lead_id: textFormValue(formData, "lead_id"),
    service_types: serviceTypes,
    amount: textFormValue(formData, "amount"),
    hours: textFormValue(formData, "hours"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      error: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const file = formData.get("file")
  let encryptedFile: Buffer | undefined

  if (file instanceof File && file.size > 0) {
    const validationError = await validateContractFile(file)
    if (validationError) {
      return { status: "error", error: validationError }
    }

    const rawBuffer = Buffer.from(await file.arrayBuffer())
    encryptedFile = encryptContractFile(rawBuffer)
  }

  const supabase = await createClient()
  const result = await createContract(supabase, parsed.data, auth.admin.id, encryptedFile)

  if (!result.ok) {
    return { status: "error", error: ERROR_MESSAGES[result.error] }
  }

  return { status: "success", id: result.id }
}

export async function updateContractAction(_prevState: UpdateContractState, formData: FormData): Promise<UpdateContractState> {
  const auth = await requireSuperAdmin(ROLE_DENIED_MESSAGE)
  if (!auth.ok) return { status: "error", error: auth.error }
  const serviceTypes = formData.getAll("service_types").filter((value): value is string => typeof value === "string")
  const parsed = updateContractSchema.safeParse({ contract_id: textFormValue(formData, "contract_id"), lead_id: textFormValue(formData, "lead_id"), service_types: serviceTypes, amount: textFormValue(formData, "amount"), hours: textFormValue(formData, "hours"), remove_file: formData.get("remove_file") !== null })
  if (!parsed.success) return { status: "error", error: "Verifique os campos destacados.", fieldErrors: parsed.error.flatten().fieldErrors }
  const file = formData.get("file")
  let encryptedFile: Buffer | undefined
  if (file instanceof File && file.size > 0) {
    const validationError = await validateContractFile(file)
    if (validationError) return { status: "error", error: validationError }
    encryptedFile = encryptContractFile(Buffer.from(await file.arrayBuffer()))
  }
  const result = await updateContract(await createClient(), parsed.data, encryptedFile)
  if (!result.ok) return { status: "error", error: ERROR_MESSAGES[result.error] }
  return { status: "success" }
}
