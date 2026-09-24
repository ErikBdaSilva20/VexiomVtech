// Postgres error code surfaced by PostgREST that this domain gives a
// specific, actionable message for — everything else collapses to "unknown".
const FOREIGN_KEY_VIOLATION = "23503"

export type WriteProjectErrorKind = "invalid_lead" | "unknown"

/**
 * Maps a Supabase/PostgREST error to a specific project-write failure kind
 * so the Server Action can surface a field-level message instead of a
 * generic one — `projects.lead_id` has an FK to `leads`, which an admin can
 * plausibly trigger by hand (e.g. picking a lead that was deleted since the
 * page loaded). Unlike `cases`, `projects` has no unique constraint, so
 * there is no `duplicate_*` kind here.
 */
export function classifyWriteProjectError(error: { code?: string } | null): WriteProjectErrorKind {
  if (error?.code === FOREIGN_KEY_VIOLATION) return "invalid_lead"
  return "unknown"
}
