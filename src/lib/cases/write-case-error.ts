// Postgres error codes surfaced by PostgREST that this domain gives a
// specific, actionable message for — everything else collapses to "unknown".
const UNIQUE_VIOLATION = "23505"
const FOREIGN_KEY_VIOLATION = "23503"

export type WriteCaseErrorKind = "duplicate_slug" | "invalid_project" | "unknown"

/**
 * Maps a Supabase/PostgREST error to a specific case-write failure kind so
 * the Server Action can surface a field-level message instead of a generic
 * one — `cases.slug` is unique and `cases.project_id` has an FK to
 * `projects`, both are things an admin can plausibly trigger by hand.
 */
export function classifyWriteCaseError(error: { code?: string } | null): WriteCaseErrorKind {
  if (error?.code === UNIQUE_VIOLATION) return "duplicate_slug"
  if (error?.code === FOREIGN_KEY_VIOLATION) return "invalid_project"
  return "unknown"
}
