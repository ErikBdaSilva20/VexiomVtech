const PAGE_SIZE = 1000

/**
 * PostgREST caps unbounded selects at a default row limit (commonly 1000) —
 * fetches every matching row in `PAGE_SIZE` pages rather than trusting a
 * single request to return everything, since a truncated result would
 * silently skew every aggregation built on top of it.
 *
 * Generic over the page-fetching call so different callers can filter
 * `financial_transactions` differently (by period, by project, ...) while
 * sharing one pagination loop — `buildPage` must apply `.range(start, end)`
 * itself alongside whatever `.eq`/`.gte`/`.order` the caller needs, since
 * Supabase's query builder type doesn't compose cleanly through a shared
 * wrapper otherwise. Scoped to `financial_transactions` callers specifically
 * (hence the Portuguese error message below) — not a general-purpose
 * pagination utility for arbitrary tables; broaden it only if a second
 * table genuinely needs the same loop.
 *
 * When the last real page is an exact multiple of `PAGE_SIZE`, one extra
 * request returning an empty page is made before the loop terminates — a
 * deliberate simplicity trade-off (an unambiguous "definitely done" signal)
 * over tracking a separate total count, at the cost of one harmless round
 * trip in that specific case.
 */
export async function fetchAllPages<T>(
  buildPage: (start: number, end: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const rows: T[] = []
  let page = 0

  for (;;) {
    const start = page * PAGE_SIZE
    const { data, error } = await buildPage(start, start + PAGE_SIZE - 1)

    if (error) {
      console.error("fetchAllPages: failed to load transactions", error)
      throw new Error("Não foi possível carregar os lançamentos financeiros.")
    }

    rows.push(...(data ?? []))
    if (!data || data.length < PAGE_SIZE) break
    page += 1
  }

  return rows
}
