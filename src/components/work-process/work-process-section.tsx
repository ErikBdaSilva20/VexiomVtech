import { WORK_STEPS } from "@/data/home-content"
import { WorkStepCard } from "@/components/work-process/work-step-card"

/** "Como trabalhamos" section — 4-step process timeline, before the final contact CTA. */
export function WorkProcessSection() {
  return (
    <section
      className="relative"
      id="como-trabalhamos"
      aria-labelledby="work-process-title"
    >
      <div className="pt-[calc(64*var(--unit))] px-[calc(94*var(--unit))] pb-[calc(70*var(--unit))] [@media(max-width:1100px)]:pt-[60px] [@media(max-width:1100px)]:px-[5%] [@media(max-width:1100px)]:pb-[50px] [@media(max-width:650px)]:pt-[40px] [@media(max-width:650px)]:px-[21px] [@media(max-width:650px)]:pb-[40px]">
        <div className="max-w-[calc(660*var(--unit))] [@media(max-width:1100px)]:max-w-[480px] [@media(max-width:650px)]:max-w-full">
          <p className="text-[#bcbcc3] text-[calc(10*var(--unit))] font-[550] leading-[calc(17*var(--unit))] tracking-[0.18em] after:content-[''] after:block after:w-[calc(28*var(--unit))] after:h-[calc(2*var(--unit))] after:mt-[calc(8*var(--unit))] after:bg-[#d8cc18]">
            COMO TRABALHAMOS
          </p>
          <h2
            id="work-process-title"
            className="mt-[calc(16*var(--unit))] text-[calc(32*var(--unit))] font-[750] leading-[1.08] tracking-[-0.05em] [@media(max-width:1100px)]:text-[26px] [@media(max-width:650px)]:text-[22px]"
          >
            Um processo claro,
            <br />
            <span className="text-vexiom-yellow">do início ao suporte.</span>
          </h2>
          <p className="mt-[calc(18*var(--unit))] text-vexiom-gray-medium text-[calc(15*var(--unit))] leading-[calc(22*var(--unit))] [@media(max-width:650px)]:text-[13px]">
            Sem etapas escondidas: você acompanha cada decisão, do primeiro
            contato até o suporte depois da entrega.
          </p>
        </div>
        <div className="relative mt-[calc(56*var(--unit))] grid grid-cols-4 gap-x-[calc(32*var(--unit))] before:content-[''] before:absolute before:top-[calc(12*var(--unit))] before:left-0 before:right-0 before:h-px before:bg-[#292b29] [@media(max-width:1100px)]:gap-x-[24px] [@media(max-width:650px)]:grid-cols-1 [@media(max-width:650px)]:gap-y-[28px] [@media(max-width:650px)]:before:hidden">
          {WORK_STEPS.map((step) => (
            <WorkStepCard key={step.index} step={step} />
          ))}
        </div>
      </div>
    </section>
  )
}
