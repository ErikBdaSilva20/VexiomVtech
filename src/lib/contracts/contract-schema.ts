import { z } from "zod"

const MAX_AMOUNT = 9_999_999_999.99
const MAX_HOURS = 99_999.99

// Closed taxonomy for the kinds of service a contract can cover. "demanda"
// (ongoing, hour-based work) is the one kind that requires `hours` to be
// filled — every other kind is a fixed-scope engagement where `hours` is
// meaningless.
export const CONTRACT_SERVICE_TYPES = [
  "site",
  "sistema_sob_medida",
  "aplicativo",
  "manutencao",
  "consultoria",
  "demanda",
] as const

export type ContractServiceType = (typeof CONTRACT_SERVICE_TYPES)[number]

const DEMANDA_SERVICE_TYPE: ContractServiceType = "demanda"

// Same rationale as `transaction-schema.ts`'s `AMOUNT_PATTERN`: validate as a
// string with at most 2 decimals first, then convert — floating-point
// multiplication is not reliable for money, and `numeric(12,2)` would
// otherwise silently round a 3rd decimal on insert.
const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/
const HOURS_PATTERN = /^\d+(\.\d{1,2})?$/

const baseContractSchema = z.object({
  lead_id: z.uuid("Lead inválido."),
  service_types: z
    .array(z.enum(CONTRACT_SERVICE_TYPES, "Tipo de serviço inválido."))
    .min(1, "Selecione ao menos um tipo de serviço."),
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
  hours: z
    .string()
    .trim()
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : null))
    .pipe(
      z
        .string()
        .regex(HOURS_PATTERN, "Use um valor numérico com no máximo 2 casas decimais.")
        .transform(Number)
        .pipe(z.number("Valor inválido.").positive("Horas devem ser maior que zero.").max(MAX_HOURS))
        .nullable()
    ),
})

/**
 * `created_by` is intentionally excluded — it is set server-side from the
 * authenticated admin, never accepted from client input (same rationale as
 * `transaction-schema.ts`). `file_object_path` also is never accepted from
 * client input in practice — it is computed by `createContract` after
 * upload — but is kept optional here for domain-layer completeness.
 */
export const createContractSchema = baseContractSchema.superRefine((data, ctx) => {
  const requiresHours = data.service_types.includes(DEMANDA_SERVICE_TYPE)
  if (requiresHours && data.hours == null) {
    ctx.addIssue({
      code: "custom",
      path: ["hours"],
      message: "Horas são obrigatórias para contratos de demanda.",
    })
  }
})

export type CreateContractInput = z.infer<typeof createContractSchema>
