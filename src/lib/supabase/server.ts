import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"

import { getSupabaseAnonKey, getSupabaseUrl } from "./env"
import type { Database } from "./database.types"

/**
 * Session-aware Supabase client for Server Components, Server Actions, and
 * Route Handlers. Reads/writes the auth cookie through Next.js's `cookies()`
 * API so the user's session survives across requests. Uses the anon key —
 * RLS still applies, this is not a privileged client (see `admin.ts` for
 * that).
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // `setAll` was called from a Server Component that can't set
            // cookies (e.g. rendering, not a Server Action/Route Handler).
            // Safe to ignore here because `proxy.ts` refreshes the session
            // on every request to `/painel-8f2k/*`.
          }
        },
      },
    }
  )
}
