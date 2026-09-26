import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"

import { AdminNav } from "@/components/admin/admin-nav"
import { getCurrentAdmin } from "@/lib/auth/get-current-admin"
import { listContracts, type ContractListItem } from "@/lib/contracts/list-contracts"
import { listContractsQuerySchema } from "@/lib/contracts/list-contracts-schema"
import { createClient } from "@/lib/supabase/server"
import { ContractRow } from "./contract-row"

export const metadata: Metadata = {
  title: "Contratos - Vexiom",
  robots: { index: false, follow: false },
}

function pageHref(page: number) {
  return page === 1 ? "/painel-8f2k/contratos" : "/painel-8f2k/contratos?page=" + page
}

export default async function AdminContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>
}) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/painel-8f2k/login")
  if (admin.role !== "super_admin") redirect("/painel-8f2k/leads")

  const rawPage = (await searchParams).page
  const parsedQuery = listContractsQuerySchema.safeParse({
    page: Array.isArray(rawPage) ? rawPage[0] : rawPage,
  })
  const query = parsedQuery.success ? parsedQuery.data : { page: 1, page_size: 20 }

  let contracts: ContractListItem[] = []
  let total = 0
  let page = query.page
  const pageSize = query.page_size
  let failed = false
  try {
    const supabase = await createClient()
    const result = await listContracts(supabase, admin, query)
    contracts = result.contracts
    total = result.total
    page = result.page
  } catch (error) {
    console.error("AdminContractsPage: failed to load contracts", error)
    failed = true
  }
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <main className="min-h-screen bg-[#0c0e0c] px-5 py-8 text-[#f1f1ed] sm:px-8 sm:py-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <AdminNav role={admin.role} active="contracts" />
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#fbd020]">Jurídico</p>
            <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">Contratos</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#aaa]">Histórico de contratos fechados e seus anexos.</p>
          </div>
          <Link href="/painel-8f2k/contratos/novo" className="inline-flex min-h-11 items-center rounded-md bg-[#fbd020] px-5 text-sm font-semibold text-[#151510] hover:bg-[#ffe45d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020]">+ Novo contrato</Link>
        </header>

        {failed ? (
          <div role="alert" className="rounded-xl border border-red-900/70 bg-red-950/30 p-5 text-sm text-red-200">Não foi possível carregar os contratos. Tente atualizar a página.</div>
        ) : contracts.length === 0 ? (
          <section className="rounded-xl border border-dashed border-[#3a3b37] bg-[#181916] px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-white">Nenhum contrato registrado</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#aaa]">Registre o primeiro contrato fechado para começar o histórico.</p>
            <Link href="/painel-8f2k/contratos/novo" className="mt-5 inline-flex min-h-11 items-center rounded-md border border-[#6c6230] px-5 text-sm font-semibold text-[#fbd020] hover:border-[#fbd020]">Registrar contrato</Link>
          </section>
        ) : (
          <>
            <p className="mb-4 text-sm text-[#aaa]">{total === 1 ? "1 contrato registrado" : total + " contratos registrados"}</p>
            <div className="overflow-x-auto rounded-xl border border-[#292b28] bg-[#181916]">
              <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#292b28] text-xs uppercase tracking-wide text-[#9fa69c]">
                    <th className="px-4 py-3 font-medium">Lead</th>
                    <th className="px-4 py-3 font-medium">Serviços</th>
                    <th className="px-4 py-3 font-medium">Valor</th>
                    <th className="px-4 py-3 font-medium">Horas</th>
                    <th className="px-4 py-3 font-medium">Criado por</th>
                    <th className="px-4 py-3 font-medium">Data</th>
                    <th className="px-4 py-3 font-medium">Anexo</th>
                    <th className="px-4 py-3 font-medium"><span className="sr-only">Ações</span></th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => <ContractRow key={contract.id} contract={contract} />)}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <nav aria-label="Páginas de contratos" className="mt-8 flex items-center justify-center gap-3 text-sm">
                {page > 1 && <Link href={pageHref(page - 1)} className="rounded-md border border-[#3a3b37] px-4 py-2 text-[#ddd] hover:border-[#fbd020]">← Anterior</Link>}
                <span className="text-[#aaa]">Página {page} de {totalPages}</span>
                {page < totalPages && <Link href={pageHref(page + 1)} className="rounded-md border border-[#3a3b37] px-4 py-2 text-[#ddd] hover:border-[#fbd020]">Próxima →</Link>}
              </nav>
            )}
          </>
        )}
      </div>
    </main>
  )
}
