import type { Metadata } from "next"

import { SERVICES } from "@/data/home-content"
import { PageHero } from "@/components/shared/page-hero"
import { ServiceCard } from "@/components/services/service-card"

export const metadata: Metadata = {
  title: "Serviços — Vexiom",
  description:
    "Sites e landing pages, sistemas sob medida, lojas online e automações com IA — conheça as soluções da Vexiom.",
}

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="O que fazemos"
        title="Soluções com propósito."
        description="Cada serviço existe para resolver um problema real de operação: presença digital, processos manuais, vendas online ou tempo perdido em tarefas repetitivas."
      />
      <section
        className="py-[calc(50*var(--unit))] px-[calc(94*var(--unit))]"
        aria-label="Lista de serviços"
      >
        <div className="grid grid-cols-[repeat(auto-fit,minmax(calc(220*var(--unit)),1fr))] gap-[calc(13*var(--unit))]">
          {SERVICES.map((service) => (
            <ServiceCard key={service.href} service={service} />
          ))}
        </div>
      </section>
    </>
  )
}
