import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"

import { AdminCaseEditorPage } from "@/components/cases/admin-case-editor-page"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { createClient } from "@/lib/supabase/server"

import { loadCaseProjectOptions } from "../project-options"

export const metadata: Metadata = {
  title: "Editar case — Vexiom",
  robots: { index: false, follow: false },
}

export default async function EditAdminCasePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()

  const supabase = await createClient()
  const [caseResult, projects] = await Promise.all([
    supabase
      .from("cases")
      .select("id,title,slug,category,client_name,is_founder_project,project_id,cover_image_url,gallery_urls,external_link,description,tech_stack,problem_solved,motivation,published,display_order")
      .eq("id", id)
      .maybeSingle(),
    loadCaseProjectOptions(supabase),
  ])

  if (caseResult.error) {
    console.error("EditAdminCasePage: failed to load case", caseResult.error)
    throw new Error("Não foi possível carregar o case.")
  }
  if (!caseResult.data) notFound()

  return <AdminCaseEditorPage admin={admin} initial={caseResult.data} projects={projects} />
}
