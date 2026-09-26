import { HeroContent } from "@/components/hero/hero-content"
import { HeroVisual } from "@/components/hero/hero-visual"

/** Hero section - copy on the left, large brand mark and decorative notes on the right. */
export function HeroSection() {
  return (
    <section
      id="inicio"
      className="relative h-[calc(603*var(--unit))] mb-[calc(80*var(--unit))] [@media(max-width:650px)]:mb-[38px] [@media(max-width:1100px)]:h-[660px] [@media(max-width:650px)]:h-auto [@media(max-width:650px)]:min-h-0 [@media(max-width:650px)]:px-[22px] [@media(max-width:650px)]:pt-[49px] [@media(max-width:650px)]:pb-[100px] [@media(max-width:360px)]:px-[17px]"
      aria-labelledby="hero-title"
    >
      <HeroContent />
      <HeroVisual />
    </section>
  )
}
