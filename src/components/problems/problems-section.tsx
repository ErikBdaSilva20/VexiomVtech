import { PROBLEMS, PROBLEMS_BRIDGE_CTA } from "@/data/home-content"
import { ProblemCard } from "@/components/problems/problem-card"
import { ArrowLink } from "@/components/shared/arrow-link"

/** Problems section — intro block, lead-in line, 4-card diagnostic grid, and the closing bridge to Services. */
export function ProblemsSection() {
  return (
    <section
      className="relative"
      id="problemas"
      aria-labelledby="problems-title"
    >
      <div className="pt-[calc(64*var(--unit))] px-[calc(94*var(--unit))] pb-[calc(70*var(--unit))] [@media(max-width:1100px)]:pt-[60px] [@media(max-width:1100px)]:px-[5%] [@media(max-width:1100px)]:pb-[50px] [@media(max-width:650px)]:pt-[40px] [@media(max-width:650px)]:px-[21px] [@media(max-width:650px)]:pb-[40px]">
        <div className="max-w-[calc(660*var(--unit))] [@media(max-width:1100px)]:max-w-[480px] [@media(max-width:650px)]:max-w-full">
          <p className="text-[#bcbcc3] text-[calc(10*var(--unit))] font-[550] leading-[calc(17*var(--unit))] tracking-[0.18em] after:content-[''] after:block after:w-[calc(28*var(--unit))] after:h-[calc(2*var(--unit))] after:mt-[calc(8*var(--unit))] after:bg-[#d8cc18]">
            ONDE A OPERAÇÃO PERDE FORÇA
          </p>
          <h2
            id="problems-title"
            className="mt-[calc(30*var(--unit))] text-[calc(32*var(--unit))] font-[750] leading-[1.08] tracking-[-0.05em] [@media(max-width:1100px)]:text-[26px] [@media(max-width:650px)]:text-[22px]"
          >
            Quatro sinais de que sua operação
            <br />
            <span className="text-vexiom-yellow">o improviso já custa caro.</span>
          </h2>
          <p className="mt-[calc(42*var(--unit))] text-vexiom-gray-medium text-[calc(15*var(--unit))] leading-[calc(22*var(--unit))] [@media(max-width:650px)]:text-[13px] [@media(max-width:650px)]:leading-[1.5]">
            Antes de falar de soluções, vale entender onde a tecnologia mal
            aplicada custa tempo, vendas e organização no dia a dia do seu
            negócio.
          </p>
        </div>
        <p className="mt-[calc(56*var(--unit))] mb-[calc(28*var(--unit))] text-[calc(13*var(--unit))] font-semibold text-vexiom-gray-medium tracking-[-0.02em]">
          Você reconhece algum destes sinais?
        </p>
        <div className="grid grid-cols-2 gap-x-[calc(24*var(--unit))] gap-y-[calc(20*var(--unit))] [@media(max-width:1100px)]:gap-[20px] [@media(max-width:650px)]:grid-cols-1 [@media(max-width:650px)]:gap-[16px]">
          {PROBLEMS.map((problem) => (
            <ProblemCard key={problem.title} problem={problem} />
          ))}
        </div>
        <div className="mt-[calc(56*var(--unit))] max-w-[calc(660*var(--unit))] pt-[calc(32*var(--unit))] border-t border-t-[#292b29] [@media(max-width:1100px)]:max-w-full [@media(max-width:650px)]:mt-[36px] [@media(max-width:650px)]:pt-[24px]">
          <p className="text-vexiom-gray-light text-[calc(20*var(--unit))] font-bold leading-[calc(27*var(--unit))] tracking-[-0.03em] [@media(max-width:650px)]:text-[18px] [@media(max-width:650px)]:leading-[1.35]">
            O problema quase nunca é falta de tecnologia.{" "}
            <span className="text-vexiom-yellow">É tecnologia sem direção.</span>
          </p>
          <p className="mt-[calc(12*var(--unit))] max-w-[calc(520*var(--unit))] text-vexiom-gray-medium text-[calc(14*var(--unit))] leading-[1.5]">
            Entender onde a operação perde tempo e oportunidades é o primeiro
            passo para construir uma solução que realmente resolve, não
            apenas mais uma ferramenta.
          </p>
          <ArrowLink
            className="group inline-flex items-center gap-[calc(10*var(--unit))] mt-[calc(20*var(--unit))] text-vexiom-yellow text-[calc(14*var(--unit))] font-bold"
            arrowClassName="w-[calc(14*var(--unit))] h-[calc(14*var(--unit))] flex-none fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round] text-vexiom-yellow transition-transform duration-[180ms] group-hover:translate-x-[calc(3*var(--unit))]"
            href={PROBLEMS_BRIDGE_CTA.href}
          >
            {PROBLEMS_BRIDGE_CTA.label}
          </ArrowLink>
        </div>
      </div>
    </section>
  )
}
