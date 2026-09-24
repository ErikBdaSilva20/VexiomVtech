import "server-only"

import { createClient as createSupabaseClient } from "@supabase/supabase-js"

import type { Database } from "./database.types"

/**
 * Service-role Supabase client — bypasses RLS entirely. The `server-only`
 * import guard throws a build error if this module is ever pulled into a
 * Client Component bundle. Only call this from server-only code (Route
 * Handlers, Server Actions), such as the future public `POST /api/leads`
 * endpoint that writes `leads` rows without an anon insert policy.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
