"use server"

import { createTransaction } from "@/lib/finance/create-transaction"
import { createTransactionSchema } from "@/lib/finance/transaction-schema"
import type { WriteTransactionErrorKind } from "@/lib/finance/write-transaction-error"
import { requireSuperAdmin } from "@/lib/auth/require-super-admin"
import { textFormValue } from "@/lib/forms/text-form-value"
import { createClient } from "@/lib/supabase/server"

const ERROR_MESSAGES: Record<WriteTransactionErrorKind, string> = {
  invalid_reference: "O projeto ou sócio selecionado não existe.",
  invalid_amount: "O valor informado é inválido.",
  unknown: "Não foi possível salvar o lançamento.",
}

const ROLE_DENIED_MESSAGE = "Apenas super_admin pode gerenciar o financeiro."

export type CreateTransactionState =
  | { status: "error"; error: string; fieldErrors?: Record<string, string[]> }
  | { status: "success"; id: string }
  | undefined

export async function createTransactionAction(
  _prevState: CreateTransactionState,
  formData: FormData
): Promise<CreateTransactionState> {
  const auth = await requireSuperAdmin(ROLE_DENIED_MESSAGE)
  if (!auth.ok) return { status: "error", error: auth.error }

  const parsed = createTransactionSchema.safeParse({
    direction: textFormValue(formData, "direction"),
    category: textFormValue(formData, "category"),
    amount: textFormValue(formData, "amount"),
    occurred_at: textFormValue(formData, "occurred_at"),
    description: textFormValue(formData, "description"),
    project_id: textFormValue(formData, "project_id"),
    partner_id: textFormValue(formData, "partner_id"),
  })

  if (!parsed.success) {
    return {
      status: "error",
      error: "Verifique os campos destacados.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }
  }

  const supabase = await createClient()
  const result = await createTransaction(supabase, parsed.data, auth.admin.id)

  if (!result.ok) {
    return { status: "error", error: ERROR_MESSAGES[result.error] }
  }

  return { status: "success", id: result.id }
}
