import type { ProblemItem } from "@/data/home-content"

interface ProblemCardProps {
  problem: ProblemItem
}

/** One diagnostic card — icon, index badge, kicker, title, description, impact line. */
export function ProblemCard({ problem }: ProblemCardProps) {
  return (
    <article className="relative pt-[calc(28*var(--unit))] px-[calc(30*var(--unit))] pb-[calc(26*var(--unit))] min-h-[calc(200*var(--unit))] border border-[#292b28] rounded-[calc(4*var(--unit))] bg-[linear-gradient(125deg,#1113106b,#10110f3b)] shadow-[inset_0_0_0_1px_#ffffff02] transition-colors duration-[180ms] hover:border-[#8b7b17] hover:bg-[#1c1d15] [@media(max-width:1100px)]:pt-[22px] [@media(max-width:1100px)]:px-[22px] [@media(max-width:1100px)]:pb-[24px] [@media(max-width:1100px)]:min-h-[auto] [@media(max-width:650px)]:pt-[20px] [@media(max-width:650px)]:px-[18px] [@media(max-width:650px)]:pb-[22px] [@media(max-width:650px)]:min-h-[auto]">
      <svg
        className="w-[calc(26*var(--unit))] h-[calc(26*var(--unit))] mb-[calc(14*var(--unit))] flex-none fill-none stroke-current text-vexiom-yellow [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]"
        aria-hidden="true"
      >
        <use href={`#${problem.icon}`} />
      </svg>
      <p
        className="absolute top-[calc(26*var(--unit))] right-[calc(28*var(--unit))] text-[calc(11*var(--unit))] font-bold tracking-[0.05em] text-vexiom-graphite-medium"
        aria-hidden="true"
      >
        {problem.index}
      </p>
      <p className="mb-[calc(8*var(--unit))] text-[#bcbcc3] text-[calc(9.5*var(--unit))] font-semibold tracking-[0.16em] uppercase">
        {problem.kicker}
      </p>
      <h3 className="mb-[calc(8*var(--unit))] text-[calc(16*var(--unit))] font-bold leading-[calc(21*var(--unit))] tracking-[-0.03em]">
        {problem.title}
      </h3>
      <p className="mb-[calc(14*var(--unit))] text-[#c6c6c8] text-[calc(13*var(--unit))] font-[450] leading-[calc(20*var(--unit))] tracking-[-0.02em]">
        {problem.description}
      </p>
      <p className="pt-[calc(10*var(--unit))] border-t border-t-[#292b28] text-vexiom-graphite-medium text-[calc(11.5*var(--unit))] font-medium tracking-[-0.01em]">
        {problem.impact}
      </p>
    </article>
  )
}
