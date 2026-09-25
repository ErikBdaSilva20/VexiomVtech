import Link from "next/link"

import { CONTACT_EMAIL, NAV_ITEMS } from "@/data/home-content"

/** Site-wide footer: brand recap, nav links, contact e-mail, copyright. */
export function SiteFooter() {
  return (
    <footer className="relative border-t border-t-[#292b29]">
      <div className="flex flex-wrap justify-between gap-[calc(48*var(--unit))] px-[calc(94*var(--unit))] pt-[calc(56*var(--unit))] pb-[calc(40*var(--unit))] [@media(max-width:1100px)]:px-[5%] [@media(max-width:1100px)]:pt-[48px] [@media(max-width:1100px)]:pb-[32px] [@media(max-width:650px)]:flex-col [@media(max-width:650px)]:gap-[32px] [@media(max-width:650px)]:px-[21px] [@media(max-width:650px)]:pt-[40px] [@media(max-width:650px)]:pb-[28px]">
        <div className="max-w-[calc(360*var(--unit))]">
          <p className="text-[calc(16*var(--unit))] font-[760] tracking-[-0.04em]">
            Vexiom
          </p>
          <p className="mt-[calc(12*var(--unit))] text-[#a7aaa5] text-[calc(13*var(--unit))] leading-[1.6]">
            Soluções digitais sob medida, simples de usar e acompanhadas de
            perto do início à evolução.
          </p>
        </div>
        <nav
          aria-label="Navegação do rodapé"
          className="flex flex-col gap-[calc(10*var(--unit))] text-[calc(13*var(--unit))]"
        >
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[#c6c6c8] transition-colors duration-[180ms] hover:text-vexiom-yellow"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-[calc(10*var(--unit))] text-[calc(13*var(--unit))]">
          <p className="text-[#bcbcc3] text-[calc(10*var(--unit))] font-[550] tracking-[0.18em]">
            CONTATO
          </p>
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-[#c6c6c8] transition-colors duration-[180ms] hover:text-vexiom-yellow"
          >
            {CONTACT_EMAIL}
          </a>
        </div>
      </div>
      <div className="border-t border-t-[#292b29] px-[calc(94*var(--unit))] py-[calc(20*var(--unit))] text-[#6f716c] text-[calc(11.5*var(--unit))] [@media(max-width:1100px)]:px-[5%] [@media(max-width:650px)]:px-[21px]">
        © {new Date().getFullYear()} Vexiom. Todos os direitos reservados.
      </div>
    </footer>
  )
}
