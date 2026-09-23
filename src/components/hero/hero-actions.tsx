import { HERO_PRIMARY_CTA, HERO_SECONDARY_CTA } from "@/data/home-content";
import { ArrowLink } from "@/components/shared/arrow-link";

/** Primary + secondary hero CTAs — primary mails in, secondary jumps to #servicos. */
export function HeroActions() {
  return (
    <div className="flex items-center mt-[calc(25*var(--unit))] ml-[calc(-5*var(--unit))] [@media(max-width:1100px)]:mt-[23px] [@media(max-width:650px)]:gap-0 [@media(max-width:650px)]:mt-[26px] [@media(max-width:650px)]:ml-0">
      <ArrowLink
        className="relative isolate inline-flex items-center justify-center gap-[calc(28*var(--unit))] h-[calc(49*var(--unit))] text-[calc(14*var(--unit))] font-[750] tracking-[-0.035em] [@media(max-width:650px)]:h-[46px] [@media(max-width:650px)]:text-[11px] [@media(max-width:650px)]:gap-[14px] [@media(max-width:360px)]:text-[10px] [@media(max-width:360px)]:gap-[10px] w-[calc(251*var(--unit))] text-[#111] before:content-[''] before:absolute before:inset-0 before:z-[-2] before:[clip-path:polygon(8%_0,100%_0,92%_100%,0_100%)] before:bg-[linear-gradient(110deg,#ffe414,#ffdd09)] hover:before:bg-[#ffed4c] [@media(max-width:650px)]:w-[58%]"
        arrowClassName="w-[calc(17*var(--unit))] h-[calc(17*var(--unit))] flex-none fill-none stroke-current [stroke-width:2.3] [stroke-linecap:round] [stroke-linejoin:round] [@media(max-width:650px)]:w-[14px] [@media(max-width:650px)]:h-[14px]"
        href={HERO_PRIMARY_CTA.href}
      >
        <p className="text-black">{HERO_PRIMARY_CTA.label}</p>
      </ArrowLink>
      <a
        className="relative isolate inline-flex items-center justify-center gap-[calc(28*var(--unit))] h-[calc(49*var(--unit))] text-[calc(14*var(--unit))] font-[750] tracking-[-0.035em] [@media(max-width:650px)]:h-[46px] [@media(max-width:650px)]:text-[11px] [@media(max-width:650px)]:gap-[14px] [@media(max-width:360px)]:text-[10px] [@media(max-width:360px)]:gap-[10px] w-[calc(190*var(--unit))] ml-[calc(-6*var(--unit))] text-[#f0f0f1] before:content-[''] before:absolute before:inset-0 before:z-[-2] before:[clip-path:polygon(11%_0,100%_0,89%_100%,0_100%)] before:bg-[#d6d6d6] after:content-[''] after:absolute after:inset-[calc(1.4*var(--unit))] after:z-[-1] after:[clip-path:polygon(11%_0,100%_0,89%_100%,0_100%)] after:bg-[#0c0d0c] hover:after:bg-[#25261e] [@media(max-width:650px)]:w-[44%] [@media(max-width:650px)]:ml-[-2%]"
        href={HERO_SECONDARY_CTA.href}
      >
        {HERO_SECONDARY_CTA.label}
      </a>
    </div>
  );
}
