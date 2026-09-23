import type { Metadata } from "next"

import { PageHero } from "@/components/shared/page-hero"

export const metadata: Metadata = {
  title: "Cases — Vexiom",
  description:
    "Projetos entregues pela Vexiom: sites, sistemas, lojas online e automações que geraram resultado real.",
}

export default function CasesPage() {
  return (
    <PageHero
      eyebrow="Resultados"
      title="Projetos que geram resultado."
      description="Em breve, uma seleção dos projetos entregues pela Vexiom e o impacto que cada um gerou."
    />
  )
}
