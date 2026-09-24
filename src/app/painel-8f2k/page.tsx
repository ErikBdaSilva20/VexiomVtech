import { redirect } from "next/navigation"

// Routes table (doc 08): `/painel-8f2k` always redirects to `/painel-8f2k/leads`.
// `proxy.ts` has already enforced session + role by the time this renders.
export default function PainelIndexPage() {
  redirect("/painel-8f2k/leads")
}
