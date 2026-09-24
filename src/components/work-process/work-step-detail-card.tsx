import type { WorkStepItem } from "@/data/home-content"

interface WorkStepDetailCardProps {
  step: WorkStepItem
}

/**
 * Expanded step block for /como-trabalhamos: index, icon, title, the same
 * teaser line shown on the home page, plus the longer `detail` copy. Reuses
 * the card surface already established by ServiceDetailCard for visual
 * consistency across interior pages.
 */
export function WorkStepDetailCard({ step }: WorkStepDetailCardProps) {
  return (
    <article className="relative pt-[calc(28*var(--unit))] px-[calc(30*var(--unit))] pb-[calc(28*var(--unit))] border border-[#292b28] rounded-[calc(4*var(--unit))] bg-[linear-gradient(125deg,#161713,#111210)] shadow-[inset_0_0_0_1px_#ffffff05] [@media(max-width:1100px)]:px-[22px] [@media(max-width:650px)]:pt-[22px] [@media(max-width:650px)]:px-[18px] [@media(max-width:650px)]:pb-[22px]">
      <div className="flex items-center gap-[calc(14*var(--unit))] mb-[calc(16*var(--unit))]">
        <svg
          className="w-[calc(26*var(--unit))] h-[calc(26*var(--unit))] flex-none fill-none stroke-current text-vexiom-yellow [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]"
          aria-hidden="true"
        >
          <use href={`#${step.icon}`} />
        </svg>
        <p className="text-vexiom-yellow text-[calc(13*var(--unit))] font-bold tracking-[0.05em]">
          {step.index}
        </p>
      </div>
      <h3 className="mb-[calc(8*var(--unit))] text-[calc(18*var(--unit))] font-bold leading-[1.15] tracking-[-0.03em]">
        {step.title}
      </h3>
      <p className="mb-[calc(12*var(--unit))] text-[#d6d6d8] text-[calc(14*var(--unit))] font-[450] leading-[calc(21*var(--unit))] tracking-[-0.02em]">
        {step.description}
      </p>
      {step.detail && (
        <p className="pt-[calc(12*var(--unit))] border-t border-t-[#292b28] text-vexiom-gray-medium text-[calc(13*var(--unit))] leading-[calc(20*var(--unit))]">
          {step.detail}
        </p>
      )}
    </article>
  )
}
