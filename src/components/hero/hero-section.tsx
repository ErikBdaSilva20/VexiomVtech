import { HeroContent } from "@/components/hero/hero-content"
import { HeroVisual } from "@/components/hero/hero-visual"

/** Hero section — copy on the left, large brand mark and decorative notes on the right. */
export function HeroSection() {
  return (
    <section id="inicio" className="hero" aria-labelledby="hero-title">
      <HeroContent />
      <HeroVisual />
    </section>
  )
}
