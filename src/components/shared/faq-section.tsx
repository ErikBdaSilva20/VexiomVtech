import type { FaqItem } from "@/data/home-content"

interface FaqSectionProps {
  items: FaqItem[]
}

/**
 * Plain <details>/<summary> accordion: expected keyboard and screen-reader
 * behavior for free, no client component or state needed.
 */
export function FaqSection({ items }: FaqSectionProps) {
  return (
    <div className="flex flex-col gap-[calc(12*var(--unit))]">
      {items.map((item) => (
        <details
          key={item.question}
          className="group border border-[#292b28] rounded-[calc(4*var(--unit))] bg-[linear-gradient(125deg,#161713,#111210)] px-[calc(24*var(--unit))] py-[calc(18*var(--unit))] [@media(max-width:650px)]:px-[18px] [@media(max-width:650px)]:py-[14px]"
        >
          <summary className="flex items-center justify-between gap-[calc(16*var(--unit))] text-[#f0f0f1] text-[calc(14.5*var(--unit))] font-bold tracking-[-0.02em] cursor-pointer list-none [&::-webkit-details-marker]:hidden [@media(max-width:650px)]:text-[13px]">
            {item.question}
            <span
              className="flex-none text-vexiom-yellow text-[calc(18*var(--unit))] leading-none transition-transform duration-[180ms] group-open:rotate-45"
              aria-hidden="true"
            >
              +
            </span>
          </summary>
          <p className="mt-[calc(12*var(--unit))] text-vexiom-gray-medium text-[calc(13.5*var(--unit))] leading-[calc(21*var(--unit))]">
            {item.answer}
          </p>
        </details>
      ))}
    </div>
  )
}
