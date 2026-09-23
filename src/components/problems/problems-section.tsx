import { PROBLEMS, PROBLEMS_BRIDGE_CTA } from "@/data/home-content"
import { ProblemCard } from "@/components/problems/problem-card"
import { ArrowLink } from "@/components/shared/arrow-link"

/** Problems section — intro block, lead-in line, 4-card diagnostic grid, and the closing bridge to Services. */
export function ProblemsSection() {
  return (
    <section
      className="problems"
      id="problemas"
      aria-labelledby="problems-title"
    >
      <div className="problems-layout">
        <div className="problems-intro">
          <p className="problems-eyebrow">PROBLEMAS QUE RESOLVEMOS</p>
          <h2 id="problems-title">
            Quatro sinais de que sua operação
            <br />
            <span className="accent">pede mais direção.</span>
          </h2>
          <p className="problems-description">
            Antes de falar de soluções, vale entender onde a tecnologia mal
            aplicada custa tempo, vendas e organização no dia a dia do seu
            negócio.
          </p>
        </div>
        <p className="problems-lead-in">Você reconhece algum destes sinais?</p>
        <div className="problem-grid">
          {PROBLEMS.map((problem) => (
            <ProblemCard key={problem.title} problem={problem} />
          ))}
        </div>
        <div className="problems-bridge">
          <p className="problems-bridge-headline">
            O problema quase nunca é falta de tecnologia.{" "}
            <span className="accent">É tecnologia sem direção.</span>
          </p>
          <p className="problems-bridge-support">
            Entender onde a operação perde tempo e oportunidades é o primeiro
            passo para construir uma solução que realmente resolve, não
            apenas mais uma ferramenta.
          </p>
          <ArrowLink
            className="problems-bridge-cta"
            arrowClassName="icon problems-bridge-arrow"
            href={PROBLEMS_BRIDGE_CTA.href}
          >
            {PROBLEMS_BRIDGE_CTA.label}
          </ArrowLink>
        </div>
      </div>
    </section>
  )
}
