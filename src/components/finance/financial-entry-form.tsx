"use client"

import Link from "next/link"
import { useState } from "react"

import {
  Form,
  FormField,
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
} from "@/components/forms/form"

type ProjectOption = { id: string; title: string }

const CATEGORIES = [
  "Receita de projeto",
  "Ferramentas e assinaturas",
  "Marketing",
  "Terceirização",
  "Impostos e taxas",
  "Equipamento",
  "Outro",
]

export function FinancialEntryForm({
  projects,
  adminId,
  adminName,
  today,
}: {
  projects: ProjectOption[]
  adminId: string
  adminName: string | null
  today: string
}) {
  const [direction, setDirection] = useState<"entrada" | "saida">("entrada")
  const [partnerId, setPartnerId] = useState("")

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.7fr)]">
      <div className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-8">
        <p role="status" className="mb-7 rounded-md border border-[#62532c] bg-[#2a2517] p-4 text-sm leading-6 text-[#e6d9a9]">
          Prévia do lançamento. O salvamento será ativado quando a integração financeira estiver disponível.
        </p>
        <Form onSubmit={(event) => event.preventDefault()} className="gap-7">
          <section aria-labelledby="entry-main-title" className="space-y-5">
            <div>
              <h2 id="entry-main-title" className="text-lg font-semibold text-white">Dados do lançamento</h2>
              <p className="mt-1 text-xs text-[#999]">Registre entrada ou saída usando o valor real da movimentação.</p>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="entry-direction" label="Tipo *">
                <FormSelect id="entry-direction" name="direction" value={direction} onChange={(event) => setDirection(event.target.value as "entrada" | "saida")} required>
                  <option value="entrada">Entrada</option>
                  <option value="saida">Saída</option>
                </FormSelect>
              </FormField>
              <FormField htmlFor="entry-amount" label="Valor (R$) *">
                <FormInput id="entry-amount" name="amount" type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="0,00" required />
              </FormField>
              <FormField htmlFor="entry-category" label="Categoria *" hint="Selecione uma sugestão ou digite outra categoria.">
                <FormInput id="entry-category" name="category" list="entry-categories" maxLength={200} required />
                <datalist id="entry-categories">{CATEGORIES.map((category) => <option key={category} value={category} />)}</datalist>
              </FormField>
              <FormField htmlFor="entry-date" label="Data *">
                <FormInput id="entry-date" name="occurred_at" type="date" defaultValue={today} required />
              </FormField>
            </div>
            <FormField htmlFor="entry-description" label="Descrição *">
              <FormTextarea id="entry-description" name="description" rows={4} maxLength={5000} placeholder="Descreva a movimentação para facilitar a conferência depois." required />
            </FormField>
          </section>

          <section aria-labelledby="entry-links-title" className="space-y-5 border-t border-[#292b28] pt-7">
            <h2 id="entry-links-title" className="text-lg font-semibold text-white">Vínculos</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField htmlFor="entry-project" label="Projeto vinculado" hint="Opcional para despesas gerais ou aportes.">
                <FormSelect id="entry-project" name="project_id" defaultValue="">
                  <option value="">Nenhum projeto</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
                </FormSelect>
              </FormField>
              <FormField htmlFor="entry-partner" label="Financiado por" hint="Use 'empresa' para movimentos do caixa.">
                <FormSelect id="entry-partner" name="partner_id" value={partnerId} onChange={(event) => setPartnerId(event.target.value)}>
                  <option value="">Caixa da empresa</option>
                  <option value={adminId}>Eu{adminName ? " · " + adminName : ""}</option>
                </FormSelect>
              </FormField>
            </div>
            {partnerId && (
              <p className="rounded-md border border-[#8a7026] bg-[#302813] px-4 py-3 text-xs leading-5 text-[#ffdf78]">
                Este lançamento será identificado como aporte/investimento pessoal, separado dos movimentos normais da empresa.
              </p>
            )}
            <p className="text-xs leading-5 text-[#85867f]">Outros sócios poderão ser selecionados quando a lista de usuários administrativos estiver disponível nesta tela.</p>
          </section>

          <div className="flex flex-col-reverse gap-3 border-t border-[#292b28] pt-6 sm:flex-row sm:items-center">
            <Link href="/painel-8f2k/financeiro" className="inline-flex min-h-11 items-center justify-center rounded-md px-4 text-sm text-[#aaa] hover:text-white focus-visible:outline-2 focus-visible:outline-[#fbd020]">Voltar ao financeiro</Link>
            <FormSubmitButton disabled className="mt-0 w-full self-stretch sm:w-auto sm:min-w-[210px] sm:self-auto">Salvar lançamento</FormSubmitButton>
          </div>
        </Form>
      </div>

      <aside className="rounded-xl border border-[#292b28] bg-[#181916] p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">Como será classificado</p>
        <h2 className="mt-3 text-lg font-semibold text-white">{direction === "entrada" ? "Entrada" : "Saída"}</h2>
        <p className="mt-2 text-sm leading-6 text-[#aaa]">
          {partnerId
            ? "Aporte pessoal: valor financiado por sócio, identificado separadamente na listagem."
            : "Movimento normal do caixa da empresa."}
        </p>
      </aside>
    </div>
  )
}
