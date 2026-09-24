import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { ProjectOption } from "@/components/cases/case-editor"
import type { Database } from "@/lib/supabase/database.types"

export async function loadCaseProjectOptions(
  supabase: SupabaseClient<Database>
): Promise<ProjectOption[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("id,title")
    .order("title", { ascending: true })
    .limit(200)

  if (error) {
    console.error("loadCaseProjectOptions: failed to load projects", error)
    return []
  }
  return data ?? []
}
