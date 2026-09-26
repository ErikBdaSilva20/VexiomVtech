import type { Metadata } from "next"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { AdminNav } from "@/components/admin/admin-nav"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { getContractDetails } from "@/lib/contracts/get-contract-details"
import { createClient } from "@/lib/supabase/server"
import { EditContractForm } from "../edit-contract-form"

export const metadata: Metadata = { title: "Editar contrato - Vexiom", robots: { index: false, follow: false } }

export default async function EditContractPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")
  const { id } = await params
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound()
  const supabase = await createClient()
  const details = await getContractDetails(supabase, id)
  if (!details) notFound()
  const { data: leads, error } = await supabase.from("leads").select("id,name,company").order("name", { ascending: true }).limit(500)
  if (error) console.error("EditContractPage: failed to load leads", error)
  const leadOptions = (leads ?? []).map((lead) => ({ id: lead.id, label: lead.company ? `${lead.name} · ${lead.company}` : lead.name }))
  return <main className="min-h-screen bg-[#0c0e0c] px-4 py-5 text-[#f1f1ed] sm:px-6 sm:py-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-3xl"><AdminNav role={admin.role} active="contracts" /><Link href={`/painel-8f2k/contratos/${id}`} className="inline-flex min-h-10 items-center gap-2 text-sm text-[#aaa] hover:text-white">← Voltar ao contrato</Link><header className="mb-7 mt-7"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Jurídico</p><h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Editar contrato</h1><p className="mt-2 text-sm leading-6 text-[#aaa]">Atualize os dados comerciais e o documento associado.</p></header><div className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-8"><EditContractForm contract={{ id: details.contract.id, lead_id: details.contract.lead_id, service_types: details.contract.service_types, amount: details.contract.amount, hours: details.contract.hours, hasFile: Boolean(details.contract.file_object_path) }} leads={leadOptions} /></div></div></main>
}
