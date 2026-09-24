// Postgres error codes surfaced by PostgREST that this domain gives a
// specific, actionable message for — everything else collapses to "unknown".
const FOREIGN_KEY_VIOLATION = "23503"
const CHECK_VIOLATION = "23514"

export type WriteTransactionErrorKind = "invalid_reference" | "invalid_amount" | "unknown"

/**
 * Maps a Supabase/PostgREST error to a specific transaction-write failure
 * kind. `financial_transactions.project_id`/`partner_id` both carry FKs an
 * admin can plausibly trigger by hand (stale dropdown option); `amount` has
 * a DB-level `check (amount > 0)` as defense-in-depth behind the Zod check,
 * in case it's ever bypassed.
 *
 * `invalid_reference` intentionally doesn't distinguish `project_id` from
 * `partner_id` — a Postgres FK violation error doesn't identify which
 * column failed without parsing the error detail string, which is brittle
 * across Postgres versions. Both references are rare to go stale at the
 * same time, so a single combined message is an acceptable trade-off.
 */
export function classifyWriteTransactionError(error: { code?: string } | null): WriteTransactionErrorKind {
  if (error?.code === FOREIGN_KEY_VIOLATION) return "invalid_reference"
  if (error?.code === CHECK_VIOLATION) return "invalid_amount"
  return "unknown"
}
