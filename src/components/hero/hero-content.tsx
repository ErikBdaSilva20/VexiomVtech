import { HeroActions } from "@/components/hero/hero-actions"
import { SolutionShortcuts } from "@/components/hero/solution-shortcuts"

/** Eyebrow, headline, description, CTAs and stats - the .hero-copy column. */
export function HeroContent() {
  return (
    <div className="absolute z-[2] top-[calc(70*var(--unit))] left-[calc(82*var(--unit))] w-[calc(660*var(--unit))] [@media(max-width:1100px)]:top-[59px] [@media(max-width:1100px)]:left-[5%] [@media(max-width:1100px)]:w-[90%] [@media(max-width:650px)]:relative [@media(max-width:650px)]:top-auto [@media(max-width:650px)]:left-auto [@media(max-width:650px)]:w-full">
      <div className="[@media(max-width:650px)]:flex [@media(max-width:650px)]:flex-col [@media(max-width:650px)]:min-h-[calc(100svh-158px)] [@media(max-width:650px)]:justify-center [@media(max-width:360px)]:min-h-[calc(100svh-136px)]">
        <p className="flex items-center gap-[calc(18*var(--unit))] text-[calc(10.5*var(--unit))] font-[550] leading-[calc(17*var(--unit))] tracking-[0.23em] whitespace-nowrap before:content-[''] before:w-[calc(30*var(--unit))] before:h-[calc(5*var(--unit))] before:flex-none before:bg-vexiom-yellow [@media(max-width:1100px)]:text-[9px] [@media(max-width:1100px)]:tracking-[0.18em] [@media(max-width:1100px)]:gap-[14px] [@media(max-width:650px)]:items-start [@media(max-width:650px)]:gap-[10px] [@media(max-width:650px)]:text-[11px] [@media(max-width:650px)]:leading-[1.5] [@media(max-width:650px)]:tracking-[0.13em] [@media(max-width:650px)]:whitespace-normal [@media(max-width:650px)]:before:w-[20px] [@media(max-width:650px)]:before:h-[4px] [@media(max-width:650px)]:before:mt-[6px] [@media(max-width:360px)]:text-[9.5px]">
          SOLUÇÕES DIGITAIS PARA NEGÓCIOS SEM GAMBIARRA
        </p>
        <h1
          id="hero-title"
          className="mt-[calc(32*var(--unit))] text-[calc(70*var(--unit))] font-extrabold leading-[0.88] tracking-[-0.067em] translate-y-[calc(4*var(--unit))] [@media(max-width:1100px)]:text-[clamp(53px,6.3vw,66px)] [@media(max-width:650px)]:mt-[28px] [@media(max-width:650px)]:text-[42px] [@media(max-width:650px)]:leading-[1] [@media(max-width:650px)]:tracking-[-0.03em] [@media(max-width:360px)]:text-[33px]!"
        >
          <span className="block w-fit whitespace-nowrap bg-[linear-gradient(#fff_18%,#dedfe7_88%)] bg-clip-text [-webkit-text-fill-color:transparent] origin-left scale-x-[0.975]">
            Tecnologia que <br />resolve o que <br />
          </span>
          <span className="block text-primary">atrasa seu negócio.</span>
        </h1>
        <p className="mt-[calc(88*var(--unit))] mr-0 mb-0 ml-[calc(2*var(--unit))] text-vexiom-gray-medium text-[calc(15*var(--unit))] font-[450] leading-[calc(22*var(--unit))] tracking-[-0.035em] [@media(max-width:1100px)]:mt-[74px] [@media(max-width:1100px)]:text-[14px] [@media(max-width:1100px)]:leading-[22px] [@media(max-width:650px)]:mt-[48px] [@media(max-width:650px)]:ml-0 [@media(max-width:650px)]:text-[16px] [@media(max-width:650px)]:leading-[1.75] [@media(max-width:650px)]:tracking-[-0.02em] [@media(max-width:650px)]:[&_br]:hidden">
          Criamos sites, sistemas, lojas virtuais e automações{" "}
          <br />
          sob medida para autônomos, pequenas empresas e startups.{" "}
          <br />
          Sem complexidade desnecessária. Mais espaço para crescer.
        </p>
        <HeroActions />
      </div>
      <SolutionShortcuts />
    </div>
  )
}
