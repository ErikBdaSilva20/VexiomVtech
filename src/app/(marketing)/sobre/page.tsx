import type { Metadata } from "next"

import { PageHero } from "@/components/shared/page-hero"

export const metadata: Metadata = {
  title: "Sobre — Vexiom",
  description:
    "Conheça a Vexiom: tecnologia projetada para acelerar negócios através de sites, sistemas, lojas online e automações com IA.",
}

export default function SobrePage() {
  return (
    <>
      <PageHero
        eyebrow="Quem somos"
        title="Tecnologia com direção clara."
        description="A Vexiom nasceu para transformar ideias em sistemas que funcionam. Combinamos engenharia de software e visão de negócio para entregar soluções que geram resultado, não só código."
      />
      <section className="page-section" aria-labelledby="sobre-missao-title">
        <h2 id="sobre-missao-title">Nossa missão</h2>
        <p>
          Ajudar negócios a crescerem com estrutura, substituindo processos
          manuais e ferramentas desconectadas por sites, sistemas e
          automações pensados para durar.
        </p>
      </section>
    </>
  )
}
