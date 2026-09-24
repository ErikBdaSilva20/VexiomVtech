import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/database.types"

type DuplicateCandidate = {
  email: string
  whatsapp: string
}

type LeadMatch = { id: string; created_at: string }

/**
 * Runs each field as its own `.eq()` query rather than a single
 * `.or("email.eq.<value>,...")` filter string — `whatsapp` has no format
 * validation (free text), so interpolating it into a PostgREST filter
 * expression could change the query's meaning if it ever contains a comma,
 * dot, or parenthesis.
 */
async function findByField(
  supabase: SupabaseClient<Database>,
  field: "email" | "whatsapp",
  value: string
): Promise<LeadMatch | null> {
  const { data, error } = await supabase
    .from("leads")
    .select("id, created_at")
    .eq(field, value)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(`findDuplicateLeadId: ${field} lookup failed`, error)
    return null
  }

  return data
}

/**
 * Finds the oldest existing lead sharing the same e-mail or WhatsApp as a
 * lead about to be created (FR6). Never blocks creation: a query failure is
 * logged and treated the same as "no match found" so this check can be
 * called from any lead-creation path (public form, future manual admin
 * entry) without adding a new failure mode to it.
 *
 * Best-effort only: two near-simultaneous submissions with the same
 * email/whatsapp can both run this check before either insert commits, so
 * both may end up with `possible_duplicate_of: null`. There is no unique
 * constraint enforcing this, matching FR6's requirement that duplicates are
 * flagged, never blocked.
 */
export async function findDuplicateLeadId(
  supabase: SupabaseClient<Database>,
  { email, whatsapp }: DuplicateCandidate
): Promise<string | null> {
  const [byEmail, byWhatsapp] = await Promise.all([
    findByField(supabase, "email", email),
    findByField(supabase, "whatsapp", whatsapp),
  ])

  const candidates = [byEmail, byWhatsapp].filter((match): match is LeadMatch => match !== null)

  if (candidates.length === 0) {
    return null
  }

  candidates.sort((a, b) => a.created_at.localeCompare(b.created_at))

  return candidates[0].id
}
