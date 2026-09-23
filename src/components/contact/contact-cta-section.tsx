import { HERO_PRIMARY_CTA } from "@/data/home-content"
import { ArrowLink } from "@/components/shared/arrow-link"

/** Final Home section — reinforces the pitch and closes with the "Agendar conversa" CTA. */
export function ContactCtaSection() {
  return (
    <section
      className="relative overflow-hidden [background:linear-gradient(104deg,#10120f_0%,#0b0c0b_61%,#15150f_100%)]"
      id="contato"
      aria-labelledby="contact-cta-title"
    >
      <div className="max-w-[calc(760*var(--unit))] mx-auto px-[calc(94*var(--unit))] pt-[calc(88*var(--unit))] pb-[calc(94*var(--unit))] text-center [@media(max-width:1100px)]:px-[5%] [@media(max-width:1100px)]:pt-[70px] [@media(max-width:1100px)]:pb-[74px] [@media(max-width:650px)]:px-[21px] [@media(max-width:650px)]:pt-[58px] [@media(max-width:650px)]:pb-[60px]">
        <p className="flex items-center justify-center gap-[calc(13*var(--unit))] text-[#c7c9c4] text-[calc(10*var(--unit))] font-[650] tracking-[0.18em] before:content-[''] before:w-[calc(29*var(--unit))] before:h-[calc(2*var(--unit))] before:bg-vexiom-yellow after:content-[''] after:w-[calc(29*var(--unit))] after:h-[calc(2*var(--unit))] after:bg-vexiom-yellow">
          VAMOS CONVERSAR
        </p>
        <h2
          id="contact-cta-title"
          className="mt-[calc(22*var(--unit))] text-[#f4f4f2] text-[calc(38*var(--unit))] font-[760] leading-[1.08] tracking-[-0.06em] [@media(max-width:1100px)]:text-[32px] [@media(max-width:650px)]:mt-[18px] [@media(max-width:650px)]:text-[27px] [@media(max-width:360px)]:text-[24px]"
        >
          Pronto para colocar seu projeto
          <br />
          <span className="text-vexiom-yellow">em movimento?</span>
        </h2>
        <p className="max-w-[calc(480*var(--unit))] mt-[calc(20*var(--unit))] mx-auto text-[#afb1ae] text-[calc(15*var(--unit))] leading-[1.6] [@media(max-width:650px)]:mt-[16px] [@media(max-width:650px)]:text-[14px]">
          Entendemos o problema na raiz e criamos soluções digitais sob
          medida, simples de usar e acompanhadas de perto do início ao
          suporte.
        </p>
        <div className="flex justify-center mt-[calc(36*var(--unit))] [@media(max-width:650px)]:mt-[28px]">
          <ArrowLink
            className="relative isolate inline-flex items-center justify-center gap-[calc(28*var(--unit))] h-[calc(49*var(--unit))] text-[calc(14*var(--unit))] font-[750] tracking-[-0.035em] [@media(max-width:650px)]:h-[46px] [@media(max-width:650px)]:text-[11px] [@media(max-width:650px)]:gap-[14px] [@media(max-width:360px)]:text-[10px] [@media(max-width:360px)]:gap-[10px] w-[calc(251*var(--unit))] text-[#111] before:content-[''] before:absolute before:inset-0 before:z-[-2] before:[clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] before:bg-[linear-gradient(110deg,#ffe414,#ffdd09)] hover:before:bg-[#ffed4c] [@media(max-width:650px)]:w-[58%]"
            arrowClassName="w-[calc(17*var(--unit))] h-[calc(17*var(--unit))] flex-none fill-none stroke-current [stroke-width:2.3] [stroke-linecap:round] [stroke-linejoin:round] [@media(max-width:650px)]:w-[14px] [@media(max-width:650px)]:h-[14px]"
            href={HERO_PRIMARY_CTA.href}
          >
            <p className="text-black">{HERO_PRIMARY_CTA.label}</p>
          </ArrowLink>
        </div>
      </div>
    </section>
  )
}
