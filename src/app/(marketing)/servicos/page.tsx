import type { Metadata } from "next"

import { SERVICES, SUPPORT_PLAN } from "@/data/home-content"
import { PageHero } from "@/components/shared/page-hero"
import { ServiceDetailCard } from "@/components/services/service-detail-card"

export const metadata: Metadata = {
  title: "Serviços - Vexiom",
  description:
    "Sites e landing pages, sistemas sob medida, lojas online e automações com IA: escopo, prazo e investimento de cada solução da Vexiom.",
}

export default function ServicosPage() {
  return (
    <>
      <PageHero
        eyebrow="O que fazemos"
        title="Soluções com propósito."
        description="Cada serviço existe para resolver um problema real. Veja o escopo e o prazo típico de cada solução; o investimento é definido depois de entendermos seu cenário, complexidade e prioridade."
      />
      <section
        className="py-[calc(50*var(--unit))] px-[calc(94*var(--unit))] [@media(max-width:1100px)]:px-[5%] [@media(max-width:650px)]:px-[21px]"
        aria-label="Lista de serviços"
      >
        <div className="grid grid-cols-2 gap-[calc(24*var(--unit))] [@media(max-width:1100px)]:gap-[20px] [@media(max-width:650px)]:grid-cols-1 [@media(max-width:650px)]:gap-[16px]">
          {SERVICES.map((service) => (
            <ServiceDetailCard key={service.title} service={service} />
          ))}
        </div>

        <div className="mt-[calc(32*var(--unit))] max-w-[calc(660*var(--unit))] pt-[calc(28*var(--unit))] border-t border-t-[#292b29] [@media(max-width:650px)]:mt-[24px] [@media(max-width:650px)]:pt-[20px]">
          <p className="text-vexiom-gray-light text-[calc(15*var(--unit))] font-bold leading-[calc(21*var(--unit))] tracking-[-0.02em]">
            Suporte contínuo:{" "}
            <span className="text-vexiom-yellow">{SUPPORT_PLAN.price}</span>
          </p>
          <p className="mt-[calc(8*var(--unit))] max-w-[calc(520*var(--unit))] text-vexiom-gray-medium text-[calc(13*var(--unit))] leading-[calc(20*var(--unit))]">
            {SUPPORT_PLAN.description}
          </p>
        </div>
      </section>
    </>
  )
}
