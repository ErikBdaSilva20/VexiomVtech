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
    <header className="page-hero">
      <p className="page-hero-eyebrow">{eyebrow}</p>
      <h1 className="page-hero-title">{title}</h1>
      {description && <p className="page-hero-description">{description}</p>}
    </header>
  )
}
