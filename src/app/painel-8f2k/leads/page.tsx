import { redirect } from "next/navigation"

import { getCurrentAdmin } from "@/lib/auth/get-current-admin"

/**
 * Stub page proving the auth loop end-to-end (Story 1.1/1.2 ACs): renders
 * the signed-in admin's name/role. Leads UI/API itself ships in a later
 * epic. Defensive redirect below is belt-and-braces — `proxy.ts` already
 * guards this route — per the Next.js DAL pattern of never trusting render
 * gating alone.
 */
export default async function LeadsPage() {
  const admin = await getCurrentAdmin()

  if (!admin) {
    redirect("/painel-8f2k/login")
  }

  return (
    <main>
      <h1>Leads</h1>
      <p>
        Bem-vindo(a), {admin.name ?? admin.id}. Papel: {admin.role}.
      </p>
    </main>
  )
}
