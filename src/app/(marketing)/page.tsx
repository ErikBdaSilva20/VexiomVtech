import { HeroSection } from "@/components/hero/hero-section"
import { SectionDivider } from "@/components/shared/section-divider"
import { ProblemsSection } from "@/components/problems/problems-section"
import { ResolutionsSection } from "@/components/resolutions/resolutions-section"
import { WorkProcessSection } from "@/components/work-process/work-process-section"
import { ContactCtaSection } from "@/components/contact/contact-cta-section"

export default function Home() {
  return (
    <>
      <HeroSection />
      <SectionDivider />
      <ProblemsSection />
      <SectionDivider direction="rtl" />
      <ResolutionsSection />
      <SectionDivider />
      <WorkProcessSection />
      <SectionDivider direction="rtl" />
      <ContactCtaSection />
    </>
  )
}
