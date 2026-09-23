import type { ReactNode } from "react"

interface PageHeroProps {
  eyebrow: string
  title: ReactNode
  description?: ReactNode
}

/**
 * Title block shared by every interior page (sobre, serviços, blog,
 * contato): eyebrow label, heading, optional lead paragraph. The home page
 * keeps its own bespoke HeroSection — this is the lighter equivalent for
 * pages that don't need the full split-column hero.
 */
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <header className="pt-[calc(70*var(--unit))] px-[calc(94*var(--unit))] pb-[calc(40*var(--unit))] border-b border-b-[#292b29]">
      <p className="flex items-center gap-[calc(18*var(--unit))] text-[#bcbcc3] text-[calc(10.5*var(--unit))] font-[550] tracking-[0.23em] uppercase before:content-[''] before:w-[calc(30*var(--unit))] before:h-[calc(5*var(--unit))] before:flex-none before:bg-vexiom-yellow">
        {eyebrow}
      </p>
      <h1 className="mt-[calc(16*var(--unit))] text-[calc(44*var(--unit))] font-[800] leading-[1.05] tracking-[-0.04em]">
        {title}
      </h1>
      {description && (
        <p className="max-w-[calc(560*var(--unit))] mt-[calc(18*var(--unit))] text-vexiom-gray-medium text-[calc(15*var(--unit))] font-[450] leading-[calc(22*var(--unit))] tracking-[-0.035em]">
          {description}
        </p>
      )}
    </header>
  )
}
