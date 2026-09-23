import { HeroSection } from "@/components/hero/hero-section"
import { SectionDivider } from "@/components/shared/section-divider"
import { ProblemsSection } from "@/components/problems/problems-section"
import { ResolutionsSection } from "@/components/resolutions/resolutions-section"

export default function Home() {
  return (
    <>
      <HeroSection />
      <SectionDivider />
      <ProblemsSection />
      <SectionDivider direction="rtl" />
      <ResolutionsSection />
    </>
  )
}
