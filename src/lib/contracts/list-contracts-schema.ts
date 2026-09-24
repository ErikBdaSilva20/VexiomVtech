import { z } from "zod"

const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

/**
 * Query params for the contracts list. Pagination only — per the spec's
 * Boundaries & Constraints, no search/filter fields beyond page/page_size
 * were asked for, so none are added here. Same bounds as
 * `list-leads-schema.ts`.
 */
export const listContractsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  page_size: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
})

export type ListContractsQuery = z.infer<typeof listContractsQuerySchema>
