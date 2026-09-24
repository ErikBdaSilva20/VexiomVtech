import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { AdminCaseEditorPage } from "@/components/cases/admin-case-editor-page"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"

import { loadCaseProjectOptions } from "../project-options"

export const metadata: Metadata = {
  title: "Novo case — Vexiom",
  robots: { index: false, follow: false },
}

export default async function NewAdminCasePage() {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const projects = await loadCaseProjectOptions(await createClient())
  return <AdminCaseEditorPage admin={admin} projects={projects} />
}
