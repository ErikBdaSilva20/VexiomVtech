import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"

import type { LeadOption } from "@/components/projects/project-editor"
import type { Database } from "@/lib/supabase/database.types"

export async function loadProjectLeadOptions(
  supabase: SupabaseClient<Database>
): Promise<LeadOption[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("id,name,company")
    .order("created_at", { ascending: false })
    .limit(200)

  if (error) {
    console.error("loadProjectLeadOptions: failed to load leads", error)
    return []
  }
  return data ?? []
}
