import type { ServiceItem } from "@/data/home-content"
import { ArrowLink } from "@/components/shared/arrow-link"

interface ServiceDetailCardProps {
  service: ServiceItem
}

/**
 * Expanded service block for the /servicos page: kicker, title, the
 * situation it fits, price/timeline meta row, scope list and CTA. Reuses
 * the same card surface (border, gradient, hover state) as ProblemCard and
 * WorkStepCard on the home page for visual consistency across the site.
 */
export function ServiceDetailCard({ service }: ServiceDetailCardProps) {
  return (
    <article className="relative pt-[calc(32*var(--unit))] px-[calc(34*var(--unit))] pb-[calc(30*var(--unit))] border border-[#292b28] rounded-[calc(4*var(--unit))] bg-[linear-gradient(125deg,#161713,#111210)] shadow-[inset_0_0_0_1px_#ffffff05] transition-colors duration-[180ms] hover:border-[#8b7b17] hover:bg-[#1c1d15] [@media(max-width:1100px)]:pt-[26px] [@media(max-width:1100px)]:px-[24px] [@media(max-width:1100px)]:pb-[26px] [@media(max-width:650px)]:pt-[22px] [@media(max-width:650px)]:px-[18px] [@media(max-width:650px)]:pb-[24px]">
      <svg
        className="w-[calc(28*var(--unit))] h-[calc(28*var(--unit))] mb-[calc(16*var(--unit))] flex-none fill-none stroke-current text-vexiom-yellow [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]"
        aria-hidden="true"
      >
        <use href={`#${service.icon}`} />
      </svg>

      {service.kicker && (
        <p className="mb-[calc(8*var(--unit))] text-[#bcbcc3] text-[calc(9.5*var(--unit))] font-semibold tracking-[0.16em] uppercase">
          {service.kicker}
        </p>
      )}

      <h3 className="mb-[calc(10*var(--unit))] text-[calc(20*var(--unit))] font-bold leading-[1.1] tracking-[-0.03em] [@media(max-width:650px)]:text-[18px]">
        {service.title}
      </h3>

      {service.problemFit && (
        <p className="mb-[calc(20*var(--unit))] text-[#d6d6d8] text-[calc(13.5*var(--unit))] font-[450] leading-[calc(20*var(--unit))] tracking-[-0.02em]">
          {service.problemFit}
        </p>
      )}

      {(service.startingPrice || service.timeline) && (
        <div className="flex flex-wrap gap-x-[calc(28*var(--unit))] gap-y-[calc(6*var(--unit))] mb-[calc(20*var(--unit))] pt-[calc(16*var(--unit))] pb-[calc(16*var(--unit))] border-t border-b border-[#292b28]">
          {service.startingPrice && (
            <div>
              <p className="text-[#a3a5a1] text-[calc(9.5*var(--unit))] font-semibold tracking-[0.14em] uppercase">
                Investimento
              </p>
              <p className="mt-[calc(4*var(--unit))] text-vexiom-yellow text-[calc(15*var(--unit))] font-bold tracking-[-0.02em]">
                {service.startingPrice}
              </p>
            </div>
          )}
          {service.timeline && (
            <div>
              <p className="text-[#a3a5a1] text-[calc(9.5*var(--unit))] font-semibold tracking-[0.14em] uppercase">
                Prazo típico
              </p>
              <p className="mt-[calc(4*var(--unit))] text-vexiom-gray-light text-[calc(15*var(--unit))] font-bold tracking-[-0.02em]">
                {service.timeline}
              </p>
            </div>
          )}
        </div>
      )}

      {service.includes && service.includes.length > 0 && (
        <ul className="flex flex-col gap-[calc(9*var(--unit))] mb-[calc(24*var(--unit))]">
          {service.includes.map((item) => (
            <li
              key={item}
              className="flex items-start gap-[calc(10*var(--unit))] text-[#d6d6d8] text-[calc(13*var(--unit))] leading-[calc(19*var(--unit))]"
            >
              <span
                className="mt-[calc(7*var(--unit))] w-[calc(5*var(--unit))] h-[calc(5*var(--unit))] flex-none rounded-full bg-vexiom-yellow"
                aria-hidden="true"
              />
              {item}
            </li>
          ))}
        </ul>
      )}

      <ArrowLink
        className="group inline-flex items-center gap-[calc(10*var(--unit))] text-vexiom-yellow text-[calc(13.5*var(--unit))] font-bold"
        arrowClassName="w-[calc(14*var(--unit))] h-[calc(14*var(--unit))] flex-none fill-none stroke-current [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round] text-vexiom-yellow transition-transform duration-[180ms] group-hover:translate-x-[calc(3*var(--unit))]"
        href={service.href}
      >
        Quero avaliar meu projeto
      </ArrowLink>
    </article>
  )
}
