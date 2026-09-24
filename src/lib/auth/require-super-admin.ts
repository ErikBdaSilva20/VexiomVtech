import "server-only"

import { getCurrentAdmin, type CurrentAdmin } from "@/lib/auth/get-current-admin"

export type RequireSuperAdminResult = { ok: true; admin: CurrentAdmin } | { ok: false; error: string }

/**
 * Shared Server Action guard for every `super_admin`-only write path
 * (`cases`, `projects`, `financial_transactions`) — defense in depth
 * alongside RLS, so a rejected caller never reaches a Supabase call.
 * `deniedMessage` lets each domain phrase its own role-denied copy.
 */
export async function requireSuperAdmin(deniedMessage: string): Promise<RequireSuperAdminResult> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return { ok: false, error: "Sessão expirada. Faça login novamente." }
  }
  if (admin.role !== "super_admin") {
    return { ok: false, error: deniedMessage }
  }
  return { ok: true, admin }
}
