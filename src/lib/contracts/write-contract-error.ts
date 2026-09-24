// Postgres error codes surfaced by PostgREST that this domain gives a
// specific, actionable message for — everything else collapses to "unknown".
const FOREIGN_KEY_VIOLATION = "23503"
const CHECK_VIOLATION = "23514"

// Constraint names from `0005_contracts.sql` — Postgres includes the
// constraint name in the error's `message`/`details`, which is how a
// `23514` (check violation) is told apart between "hours missing/invalid"
// and "amount invalid" (both raise the same error code).
const HOURS_CHECK_CONSTRAINT = "contracts_hours_positive"

export type WriteContractErrorKind = "invalid_lead" | "invalid_hours" | "invalid_amount" | "unknown"

/**
 * Maps a Supabase/PostgREST error to a specific contract-write failure kind.
 * `contracts.lead_id` carries an FK an admin can plausibly trigger by hand
 * (stale dropdown option) → `invalid_lead`. `contracts.amount`/`hours` and
 * `contracts.service_types` all have DB-level `check` constraints as
 * defense-in-depth behind the Zod schema's own validation (including the
 * "demanda requires hours" `superRefine`), in case any is ever bypassed —
 * the `hours` constraint (`contracts_hours_positive`) is classified as
 * `invalid_hours`; any other check violation (amount, service_types)
 * collapses to `invalid_amount`, mirroring `write-transaction-error.ts`'s
 * shape for this domain.
 */
export function classifyWriteContractError(error: { code?: string; message?: string } | null): WriteContractErrorKind {
  if (error?.code === FOREIGN_KEY_VIOLATION) return "invalid_lead"
  if (error?.code === CHECK_VIOLATION) {
    return error.message?.includes(HOURS_CHECK_CONSTRAINT) ? "invalid_hours" : "invalid_amount"
  }
  return "unknown"
}
