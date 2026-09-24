import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

import type { AdminRole } from "@/lib/supabase/database.types"

const LOGIN_PATH = "/painel-8f2k/login"
const DEFAULT_AUTHENTICATED_PATH = "/painel-8f2k/leads"

/**
 * Route prefixes restricted to specific roles. Empty in this spec — no
 * super_admin-only route exists yet — but kept role-generic so Epic 2+ can
 * add entries (e.g. `{ prefix: "/painel-8f2k/financeiro", roles:
 * ["super_admin"] }`) without touching the gating logic itself.
 */
const ROLE_RESTRICTED_PREFIXES: Array<{ prefix: string; roles: AdminRole[] }> = []

/**
 * Session + role gate for every `/painel-8f2k/*` route (doc 08):
 * - No session → redirect to `/painel-8f2k/login`.
 * - Session but no matching `admin_users` row → treated as unauthenticated,
 *   same redirect (FR1 AC3).
 * - Session with a role that doesn't match the requested route → redirect to
 *   `/painel-8f2k/leads`.
 *
 * This performs an optimistic-but-verified check: unlike a pure cookie
 * read, it calls Supabase Auth (`getUser`) and queries `admin_users`, so it
 * is the actual authorization boundary for this route group, not just a UX
 * shortcut. `getCurrentAdmin` (the DAL) still re-checks inside pages/actions
 * per the Data Access Layer pattern.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (pathname === LOGIN_PATH) {
    // Already authenticated and admin? Skip the login form.
    if (user) {
      const { data: adminUser } = await supabase
        .from("admin_users")
        .select("role")
        .eq("user_id", user.id)
        .single()

      if (adminUser) {
        return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_PATH, request.url))
      }
    }
    return response
  }

  if (!user) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
  }

  const { data: adminUser } = await supabase
    .from("admin_users")
    .select("role")
    .eq("user_id", user.id)
    .single()

  if (!adminUser) {
    // Authenticated in Supabase Auth, but no admin_users row: unauthorized.
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
  }

  const restriction = ROLE_RESTRICTED_PREFIXES.find(({ prefix }) => pathname.startsWith(prefix))

  if (restriction && !restriction.roles.includes(adminUser.role)) {
    return NextResponse.redirect(new URL(DEFAULT_AUTHENTICATED_PATH, request.url))
  }

  return response
}

export const config = {
  matcher: ["/painel-8f2k/:path*"],
}
