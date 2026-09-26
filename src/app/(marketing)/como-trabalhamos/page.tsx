import type { Metadata } from "next"

import { WORK_STEPS, HOW_WE_WORK_FAQS } from "@/data/home-content"
import { PageHero } from "@/components/shared/page-hero"
import { WorkStepDetailCard } from "@/components/work-process/work-step-detail-card"
import { FaqSection } from "@/components/shared/faq-section"

export const metadata: Metadata = {
  title: "Como trabalhamos - Vexiom",
  description:
    "Conheça o processo da Vexiom: conversa inicial, definição da solução, desenvolvimento e entrega com orientação.",
}

export default function ComoTrabalhamosPage() {
  return (
    <>
      <PageHero
        eyebrow="Processo"
        title="Como trabalhamos."
        description="Conversa inicial, definição da solução, desenvolvimento e entrega com orientação. Um processo claro, sem etapas escondidas, do primeiro contato até depois do lançamento - com suporte contínuo opcional."
      />
      <section
        className="py-[calc(50*var(--unit))] px-[calc(94*var(--unit))] [@media(max-width:1100px)]:px-[5%] [@media(max-width:650px)]:px-[21px]"
        aria-label="As quatro etapas do processo"
      >
        <div className="grid grid-cols-2 gap-[calc(24*var(--unit))] [@media(max-width:1100px)]:gap-[20px] [@media(max-width:650px)]:grid-cols-1 [@media(max-width:650px)]:gap-[16px]">
          {WORK_STEPS.map((step) => (
            <WorkStepDetailCard key={step.index} step={step} />
          ))}
        </div>
      </section>
      <section
        className="py-[calc(50*var(--unit))] px-[calc(94*var(--unit))] border-t border-t-[#292b29] [@media(max-width:1100px)]:px-[5%] [@media(max-width:650px)]:px-[21px]"
        aria-labelledby="faq-title"
      >
        <p className="text-[#bcbcc3] text-[calc(10*var(--unit))] font-[550] leading-[calc(17*var(--unit))] tracking-[0.18em] after:content-[''] after:block after:w-[calc(28*var(--unit))] after:h-[calc(2*var(--unit))] after:mt-[calc(8*var(--unit))] after:bg-[#d8cc18]">
          PERGUNTAS FREQUENTES
        </p>
        <h2
          id="faq-title"
          className="mt-[calc(22*var(--unit))] text-[calc(28*var(--unit))] font-[750] leading-[1.08] tracking-[-0.05em] [@media(max-width:650px)]:text-[22px]"
        >
          Antes de conversar, tire{" "}
          <span className="text-vexiom-yellow">algumas dúvidas.</span>
        </h2>
        <div className="max-w-[calc(760*var(--unit))] mt-[calc(32*var(--unit))]">
          <FaqSection items={HOW_WE_WORK_FAQS} />
        </div>
      </section>
    </>
  )
}
