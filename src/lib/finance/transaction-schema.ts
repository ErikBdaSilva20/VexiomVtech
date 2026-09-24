import { z } from "zod"

const MAX_SHORT_TEXT = 200
const MAX_LONG_TEXT = 5000

// `numeric(12,2)` in Postgres caps at 10 integer digits + 2 decimals.
const MAX_AMOUNT = 9_999_999_999.99

const TRANSACTION_DIRECTIONS = ["entrada", "saida"] as const

// Validated as a string first (at most 2 decimals) rather than coerced then
// checked numerically — floating-point multiplication (`value * 100`) is
// not reliable for this (e.g. `10.1 * 100 !== 1010` in IEEE 754), and
// `numeric(12,2)` would otherwise silently round a 3rd decimal on insert.
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/

function optionalUuid() {
  return z
    .string()
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))
    .pipe(z.uuid("Referência inválida.").nullable())
}

/**
 * `created_by` is intentionally excluded — it is set server-side from the
 * authenticated admin (Story 5.2), never accepted from client input, so a
 * caller cannot attribute a transaction to a different admin.
 */
export const createTransactionSchema = z.object({
  direction: z.enum(TRANSACTION_DIRECTIONS, "Selecione entrada ou saída."),
  category: z.string().trim().min(1, "Categoria é obrigatória.").max(MAX_SHORT_TEXT),
  amount: z
    .string()
    .trim()
    .regex(AMOUNT_PATTERN, "Use um valor numérico com no máximo 2 casas decimais.")
    .transform(Number)
    .pipe(
      z
        .number("Valor inválido.")
        .positive("Valor deve ser maior que zero.")
        .max(MAX_AMOUNT, "Valor excede o limite permitido.")
    ),
  occurred_at: z.iso.date("Data inválida."),
  description: z.string().trim().min(1, "Descrição é obrigatória.").max(MAX_LONG_TEXT),
  project_id: optionalUuid(),
  partner_id: optionalUuid(),
})

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
