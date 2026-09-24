import { z } from "zod"

/**
 * Period filter for the prospecting overview (FR21). Both bounds are
 * optional independently — `from`-only means "since then", `to`-only means
 * "up to then". Resolving the default window (last 12 months) is the DAL's
 * job, not the schema's, since "now" isn't a parseable input.
 */
export const prospectingOverviewQuerySchema = z
  .object({
    from: z.iso.date({ error: "Data inicial inválida." }).nullish(),
    to: z.iso.date({ error: "Data final inválida." }).nullish(),
  })
  .refine((value) => !value.from || !value.to || value.from <= value.to, {
    error: "A data inicial deve ser anterior ou igual à data final.",
    path: ["from"],
  })

export type ProspectingOverviewQuery = z.infer<typeof prospectingOverviewQuerySchema>
