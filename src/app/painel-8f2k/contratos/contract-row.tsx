"use client"

import { useRouter } from "next/navigation"
import type { KeyboardEvent } from "react"

import type { ContractListItem } from "@/lib/contracts/list-contracts"

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" })
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
const SERVICE_TYPE_LABELS: Record<string, string> = { site: "Site", sistema_sob_medida: "Sistema sob medida", aplicativo: "Aplicativo", manutencao: "Manutenção", consultoria: "Consultoria", demanda: "Demanda" }

export function ContractRow({ contract }: { contract: ContractListItem }) {
  const router = useRouter()
  const href = `/painel-8f2k/contratos/${contract.id}`

  function openDetails() { router.push(href) }
  function handleKeyDown(event: KeyboardEvent<HTMLTableRowElement>) {
    if (event.target instanceof HTMLElement && event.target.closest("a")) return
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDetails() }
  }

  return <tr tabIndex={0} role="link" aria-label={`Ver detalhes do contrato de ${contract.lead_name ?? "lead removido"}`} onClick={(event) => { if (event.target instanceof HTMLElement && event.target.closest("a")) return; openDetails() }} onKeyDown={handleKeyDown} className="group relative cursor-pointer border-b border-[#292b28] outline-none transition-colors duration-200 last:border-b-0 hover:bg-[#22241f] focus-visible:bg-[#22241f] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#fbd020]">
    <td className="px-4 py-4 text-[#e5e5df]"><span className="font-medium transition-colors group-hover:text-[#fbd020]">{contract.lead_name ?? "Lead removido"}</span><p className="mt-1 font-mono text-[10px] text-[#6b6c66]">{contract.id}</p></td>
    <td className="px-4 py-4 text-[#c7c7c0]">{contract.service_types.map((type) => SERVICE_TYPE_LABELS[type] ?? type).join(", ")}</td>
    <td className="whitespace-nowrap px-4 py-4 text-[#e5e5df]">{money.format(contract.amount)}</td>
    <td className="px-4 py-4 text-[#c7c7c0]">{contract.hours != null ? contract.hours + "h" : "-"}</td>
    <td className="px-4 py-4 text-[#c7c7c0]">{contract.created_by_name ?? "-"}</td>
    <td className="whitespace-nowrap px-4 py-4 text-[#9fa69c]">{dateFormatter.format(new Date(contract.created_at))}</td>
    <td className="px-4 py-4">{contract.has_file ? <a href={`${href}/download`} className="relative z-10 inline-flex min-h-9 items-center rounded-md border border-[#6c6230] px-3 text-xs font-semibold text-[#fbd020] transition-colors hover:border-[#fbd020]">Baixar</a> : <span className="text-xs text-[#6b6c66]">Sem anexo</span>}</td>
    <td className="px-4 py-4 text-right"><span className="whitespace-nowrap text-xs font-semibold text-[#fbd020] opacity-70 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100">Abrir detalhes <span aria-hidden="true">→</span></span></td>
  </tr>
}
