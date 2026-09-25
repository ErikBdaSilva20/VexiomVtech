import Link from "next/link"

import { LEAD_STATUS_LABELS } from "@/components/leads/lead-status-labels"
import type { Database } from "@/lib/supabase/database.types"

type LeadRow = Database["public"]["Tables"]["leads"]["Row"]

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value))
}

function statusStyle(status: string) {
  if (status === "contrato_fechado") return "border-emerald-800 bg-emerald-950/50 text-emerald-200"
  if (status === "nao_convertido") return "border-[#4b5049] bg-[#242824] text-[#c4cac1]"
  if (status === "follow_up_pendente") return "border-amber-700 bg-amber-950/40 text-amber-100"
  return "border-[#69602f] bg-[#2a2718] text-[#ffe363]"
}

/**
 * A single lead's card markup — extracted from `LeadListSection` so the
 * leads-overview drill-down panel (`lead-drilldown-panel.tsx`) can reuse the
 * exact same item rendering instead of duplicating it.
 */
export function LeadListItem({ lead, adminId }: { lead: LeadRow; adminId: string }) {
  return (
    <article className="grid min-w-0 gap-5 p-5 lg:grid-cols-[minmax(190px,1.15fr)_minmax(170px,0.8fr)_minmax(210px,1fr)_auto] lg:items-center sm:p-6">
      <div className="min-w-0">
        <h3 className="truncate text-base font-semibold text-white">
          <Link
            prefetch={false}
            href={"/painel-8f2k/leads/" + lead.id}
            className="rounded-sm hover:text-[#fbd020] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#fbd020]"
          >
            {lead.name}
          </Link>
        </h3>
        {lead.company && <p className="mt-1 truncate text-sm text-[#b8beb5]">{lead.company}</p>}
        <div className="mt-2 flex min-w-0 flex-col gap-1 text-xs text-[#929a90]">
          <a className="truncate hover:text-white hover:underline" href={"mailto:" + lead.email}>{lead.email}</a>
          <a className="hover:text-white hover:underline" href={"tel:" + lead.whatsapp}>{lead.whatsapp}</a>
        </div>
      </div>

      <div className="min-w-0">
        <span className={"inline-flex max-w-full rounded-full border px-3 py-1 text-xs font-medium " + statusStyle(lead.status)}>
          <span className="truncate">{LEAD_STATUS_LABELS[lead.status] ?? lead.status}</span>
        </span>
        <p className="mt-2 truncate text-xs text-[#a9b0a6]">{lead.project_type}</p>
        {(lead.tags?.length ?? 0) > 0 && (
          <p className="mt-1 truncate text-xs text-[#7f887d]">{lead.tags?.join(" · ")}</p>
        )}
      </div>

      <div className="min-w-0 rounded-lg border border-[#30362e] bg-[#111311] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#858d82]">Próxima ação</p>
        {lead.next_action ? (
          <>
            <p className="mt-1 truncate text-sm text-[#e3e7e0]">{lead.next_action}</p>
            {lead.next_action_at && <time dateTime={lead.next_action_at} className="mt-1 block text-xs text-[#aab1a7]">{formatDate(lead.next_action_at)}</time>}
          </>
        ) : (
          <p className="mt-1 text-sm text-[#9da49a]">Não definida</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-4 lg:block lg:text-right">
        <div>
          <p className="text-xs text-[#aab1a7]">
            {lead.assigned_to === adminId ? "Responsável: você" : lead.assigned_to ? "Responsável atribuído" : "Sem responsável"}
          </p>
          <p className="mt-1 text-xs text-[#7f887d]">{formatDate(lead.created_at)}</p>
        </div>
        <Link
          prefetch={false}
          href={"/painel-8f2k/leads/" + lead.id}
          aria-label={"Abrir lead " + lead.name}
          className="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-[#4a5147] text-[#fbd020] hover:border-[#fbd020] hover:bg-[#282515] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020] lg:mt-3"
        >
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      {lead.possible_duplicate_of && (
        <p className="rounded-lg border border-amber-800/50 bg-amber-950/20 px-3 py-2 text-xs text-amber-100 lg:col-span-4">
          Possível duplicidade — confira o contato antes de iniciar outra conversa.
        </p>
      )}
    </article>
  )
}
