import { z } from "zod"

const MAX_SEARCH_LENGTH = 200
const MAX_FILTER_LENGTH = 100
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

function optionalFilter(maxLength: number) {
  return z
    .string()
    .trim()
    .max(maxLength)
    .nullish()
    .transform((value) => (value && value.length > 0 ? value : undefined))
}

/**
 * Query params for the leads list (FR8). All filters are optional and
 * combine with AND; `search` matches name/company/email/whatsapp with OR
 * semantics (see `listLeads`).
 */
export const listLeadsQuerySchema = z.object({
  search: optionalFilter(MAX_SEARCH_LENGTH),
  status: optionalFilter(MAX_FILTER_LENGTH),
  tag: optionalFilter(MAX_FILTER_LENGTH),
  project_type: optionalFilter(MAX_FILTER_LENGTH),
  assigned_to: z.uuid().nullish().transform((value) => value ?? undefined),
  // Optional `created_at` range (America/Sao_Paulo calendar dates), used by
  // the leads-overview drill-down to filter a "month" slice — mirrors
  // `prospecting-overview-schema.ts`'s date handling.
  from: z.iso.date({ error: "Data inicial inválida." }).nullish().transform((value) => value ?? undefined),
  to: z.iso.date({ error: "Data final inválida." }).nullish().transform((value) => value ?? undefined),
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
}).refine((value) => !value.from || !value.to || value.from <= value.to, {
  error: "A data inicial deve ser anterior ou igual à data final.",
  path: ["from"],
})

export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>
