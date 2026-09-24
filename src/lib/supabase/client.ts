import { createBrowserClient } from "@supabase/ssr"

import type { Database } from "./database.types"

/**
 * Supabase client for Client Components. Uses the anon key — safe to bundle
 * for the browser; RLS enforces what it can actually read/write. Not used by
 * Epic 1's login flow (a Server Action), kept for client components that
 * need Supabase in later epics.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
