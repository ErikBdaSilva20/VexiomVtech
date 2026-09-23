import type { ReactNode } from "react"

import { IconSprite } from "@/components/shared/icon-sprite"
import { BackgroundArt } from "@/components/shared/background-art"
import { SiteHeader } from "@/components/site-header"

/**
 * Chrome shared by every marketing route (home, sobre, serviços, blog,
 * contato): icon sprite, background art, skip link and header. Kept as a
 * layout so it exists exactly once regardless of how many routes join the
 * group, instead of being copy-pasted into each page.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <IconSprite />
      <div className="page">
        <a href="#conteudo" className="skip-link">
          Pular para o conteúdo
        </a>
        <BackgroundArt />
        <SiteHeader />
        <main id="conteudo">{children}</main>
      </div>
    </>
  )
}
