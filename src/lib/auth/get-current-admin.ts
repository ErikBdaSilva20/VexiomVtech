import "server-only"

import { cache } from "react"

import { createClient } from "@/lib/supabase/server"
import type { AdminRole } from "@/lib/supabase/database.types"

export type CurrentAdmin = {
  id: string
  role: AdminRole
  name: string | null
}

// Supabase's "no rows found" error code for `.single()` — expected when a
// Supabase Auth user has no matching `admin_users` row, not a real failure.
const NO_ROWS_ERROR_CODE = "PGRST116"

/**
 * Single place every layer trusts for "who is this admin". Reads the
 * Supabase Auth session, then joins `admin_users` to resolve the app-level
 * role — a valid Supabase Auth session with no matching `admin_users` row is
 * treated as unauthenticated (FR1 AC3), not as a valid-but-roleless user.
 *
 * `React.cache`-wrapped so multiple calls within the same request/render
 * pass reuse one Supabase round trip. Epic 2+ routes/pages/actions should
 * import this rather than re-querying `admin_users` directly.
 */
export const getCurrentAdmin = cache(async (): Promise<CurrentAdmin | null> => {
  const supabase = await createClient()

  // getUser() re-validates the JWT against Supabase Auth rather than trusting
  // the (possibly stale/tampered) session cookie payload — recommended over
  // getSession() for server-side authorization checks.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: adminUser, error: adminUserError } = await supabase
    .from("admin_users")
    .select("role, name")
    .eq("user_id", user.id)
    .single()

  if (adminUserError && adminUserError.code !== NO_ROWS_ERROR_CODE) {
    console.error("getCurrentAdmin: failed to look up admin_users row", adminUserError)
  }

  if (!adminUser) {
    return null
  }

  return { id: user.id, role: adminUser.role, name: adminUser.name }
})
