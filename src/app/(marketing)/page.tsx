import { HeroSection } from "@/components/hero/hero-section"
import { SectionDivider } from "@/components/shared/section-divider"
import { ProblemsSection } from "@/components/problems/problems-section"
import { ServicesSection } from "@/components/services/services-section"

export default function Home() {
  return (
    <>
      <HeroSection />
      <SectionDivider />
      <ProblemsSection />
      <SectionDivider direction="rtl" />
      <ServicesSection />
    </>
  )
}
