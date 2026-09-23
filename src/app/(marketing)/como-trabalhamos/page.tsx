import type { Metadata } from "next"

import { PageHero } from "@/components/shared/page-hero"

export const metadata: Metadata = {
  title: "Como trabalhamos — Vexiom",
  description:
    "Conheça o processo da Vexiom: da análise do cenário até a entrega do sistema em produção.",
}

export default function ComoTrabalhamosPage() {
  return (
    <PageHero
      eyebrow="Processo"
      title="Como trabalhamos."
      description="Diagnóstico, arquitetura, implementação e acompanhamento — cada etapa pensada para entregar sistemas que funcionam de verdade."
    />
  )
}
