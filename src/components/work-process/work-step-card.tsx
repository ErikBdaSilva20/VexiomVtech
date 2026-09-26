import type { WorkStepItem } from "@/data/home-content"

interface WorkStepCardProps {
  step: WorkStepItem
}

/** One step in the "how we work" timeline — index badge, icon, title, description. */
export function WorkStepCard({ step }: WorkStepCardProps) {
  return (
    <div className="relative pt-[calc(24*var(--unit))] [@media(max-width:650px)]:pt-0">
      <p className="text-vexiom-yellow text-[calc(13*var(--unit))] font-bold tracking-[0.05em]">
        {step.index}
      </p>
      {/* On mobile the icon becomes the "dot" on the vertical timeline line
          drawn behind the cards (see work-process-section.tsx) - the solid
          background punches a clean gap in that line instead of the line
          showing through the icon's outline strokes. */}
      <span className="relative z-10 mt-[calc(12*var(--unit))] mb-[calc(14*var(--unit))] inline-grid [@media(max-width:650px)]:h-[38px] [@media(max-width:650px)]:w-[38px] [@media(max-width:650px)]:-ml-[6px] [@media(max-width:650px)]:place-items-center [@media(max-width:650px)]:rounded-full [@media(max-width:650px)]:bg-[#0b0c0b]">
        <svg
          className="w-[calc(26*var(--unit))] h-[calc(26*var(--unit))] flex-none fill-none stroke-current text-vexiom-yellow [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round]"
          aria-hidden="true"
        >
          <use href={`#${step.icon}`} />
        </svg>
      </span>
      <h3 className="mb-[calc(8*var(--unit))] text-[calc(16*var(--unit))] font-bold leading-[calc(21*var(--unit))] tracking-[-0.03em]">
        {step.title}
      </h3>
      <p className="text-[#c6c6c8] text-[calc(13*var(--unit))] font-[450] leading-[calc(20*var(--unit))] tracking-[-0.02em]">
        {step.description}
      </p>
    </div>
  )
}
