"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"

export type LeadSection = "overview" | "alerts" | "list"

const SECTION_OPTIONS: Array<{
  value: LeadSection
  label: string
  description: string
}> = [
  {
    value: "overview",
    label: "Visão geral",
    description: "Indicadores do período, funil e origem das oportunidades.",
  },
  {
    value: "alerts",
    label: "Alertas e agenda",
    description: "Pendências que precisam de atenção e compromissos próximos.",
  },
  {
    value: "list",
    label: "Lista de leads",
    description: "Busca, filtros e acesso ao histórico de cada contato.",
  },
]

export function LeadSectionSelector({
  section,
  hrefs,
}: {
  section: LeadSection
  hrefs: Record<LeadSection, string>
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selected, setSelected] = useState(section)
  const current = SECTION_OPTIONS.find((option) => option.value === selected) ?? SECTION_OPTIONS[0]

  useEffect(() => {
    for (const option of SECTION_OPTIONS) {
      if (option.value !== section) router.prefetch(hrefs[option.value])
    }
  }, [hrefs, router, section])

  function changeSection(value: LeadSection) {
    setSelected(value)
    startTransition(() => router.replace(hrefs[value], { scroll: false }))
  }

  return (
    <section
      aria-labelledby="lead-section-label"
      className="mb-8 grid gap-4 rounded-2xl border border-[#343a32] bg-[#171a17] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.16)] sm:p-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-center"
    >
      <div className="min-w-0">
        <p id="lead-section-label" className="text-xs font-semibold uppercase tracking-[0.16em] text-[#fbd020]">
          Área de trabalho
        </p>
        <p className="mt-1 text-sm leading-6 text-[#b7beb4]">{current.description}</p>
      </div>
      <div className="relative">
        <label className="block">
          <span className="sr-only">Selecionar seção de leads</span>
          <select
          value={selected}
          disabled={pending}
          onChange={(event) => changeSection(event.target.value as LeadSection)}
          className="min-h-12 w-full rounded-lg border border-[#4a5147] bg-[#0f110f] px-4 text-sm font-semibold text-white outline-none transition hover:border-[#747d70] focus-visible:border-[#fbd020] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fbd020] disabled:cursor-wait disabled:opacity-70"
        >
          {SECTION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
          </select>
        </label>
        {pending && (
          <p role="status" className="absolute right-3 top-full mt-1 text-xs font-medium text-[#fbd020]">
            Carregando seção…
          </p>
        )}
      </div>
    </section>
  )
}
