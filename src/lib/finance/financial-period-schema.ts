import { z } from "zod"

/**
 * Period filter for the financial dashboard (FR37). Both bounds are
 * optional independently — mirrors `prospecting-overview-schema.ts`.
 * Resolving the default window (current calendar month) is the DAL's job,
 * not the schema's, since "now" isn't a parseable input.
 */
export const financialPeriodQuerySchema = z
  .object({
    from: z.iso.date({ error: "Data inicial inválida." }).nullish(),
    to: z.iso.date({ error: "Data final inválida." }).nullish(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    error: "A data inicial deve ser anterior ou igual à data final.",
    path: ["from"],
  })

export type FinancialPeriodQuery = z.infer<typeof financialPeriodQuerySchema>
