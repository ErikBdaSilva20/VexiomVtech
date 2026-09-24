import { NextResponse } from "next/server"

import { findDuplicateLeadId } from "@/lib/leads/duplicate-detection"
import { publicLeadSchema } from "@/lib/leads/lead-schema"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Public lead intake (FR4/FR5). Writes with the service-role client because
 * `leads` has no anonymous insert RLS policy by design (NFR3) — this
 * endpoint is the only path a visitor's payload can turn into a row.
 */
export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 })
  }

  const parsed = publicLeadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Dados inválidos.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  try {
    const supabase = createAdminClient()

    const possibleDuplicateOf = await findDuplicateLeadId(supabase, {
      email: parsed.data.email,
      whatsapp: parsed.data.whatsapp,
    })

    const { data, error } = await supabase
      .from("leads")
      .insert({ ...parsed.data, source: "site", possible_duplicate_of: possibleDuplicateOf })
      .select("id")
      .single()

    if (error) {
      console.error("POST /api/leads: failed to insert lead", error)
      return NextResponse.json(
        { error: "Não foi possível registrar seu contato. Tente novamente." },
        { status: 500 }
      )
    }

    return NextResponse.json({ id: data.id }, { status: 201 })
  } catch (error) {
    console.error("POST /api/leads: unexpected failure", error)
    return NextResponse.json(
      { error: "Não foi possível registrar seu contato. Tente novamente." },
      { status: 500 }
    )
  }
}
