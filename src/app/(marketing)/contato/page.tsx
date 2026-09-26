import type { Metadata } from "next"

import { PageHero } from "@/components/shared/page-hero"
import { ContactForm } from "@/components/contact/contact-form"

export const metadata: Metadata = {
  title: "Contato - Vexiom",
  description:
    "Fale com a Vexiom sobre o seu projeto: sites, sistemas, lojas online ou automações com IA.",
}

export default function ContatoPage() {
  return (
    <>
      <PageHero
        eyebrow="Vamos conversar"
        title="Conte sobre o seu projeto."
        description="Responda algumas perguntas rápidas e entraremos em contato para entender o seu cenário."
      />
      <section
        className="py-[calc(50*var(--unit))] px-[calc(94*var(--unit))] [@media(max-width:650px)]:px-[24px]"
        aria-label="Formulário de contato"
      >
        <ContactForm />
      </section>
    </>
  )
}
