import { HeroActions } from "@/components/hero/hero-actions"
import { SolutionShortcuts } from "@/components/hero/solution-shortcuts"

/** Eyebrow, headline, description, CTAs and stats — the .hero-copy column. */
export function HeroContent() {
  return (
    <div className="absolute z-[2] top-[calc(70*var(--unit))] left-[calc(82*var(--unit))] w-[calc(660*var(--unit))] [@media(max-width:1100px)]:top-[59px] [@media(max-width:1100px)]:left-[5%] [@media(max-width:1100px)]:w-[90%] [@media(max-width:650px)]:relative [@media(max-width:650px)]:top-auto [@media(max-width:650px)]:left-auto [@media(max-width:650px)]:w-full">
      <p className="flex items-center gap-[calc(18*var(--unit))] text-[calc(10.5*var(--unit))] font-[550] leading-[calc(14*var(--unit))] tracking-[0.23em] whitespace-nowrap before:content-[''] before:w-[calc(30*var(--unit))] before:h-[calc(5*var(--unit))] before:flex-none before:bg-vexiom-yellow [@media(max-width:1100px)]:text-[9px] [@media(max-width:1100px)]:tracking-[0.18em] [@media(max-width:1100px)]:gap-[14px] [@media(max-width:650px)]:gap-[9px] [@media(max-width:650px)]:text-[7.4px] [@media(max-width:650px)]:tracking-[0.15em] [@media(max-width:650px)]:before:w-[23px] [@media(max-width:650px)]:before:h-[4px] [@media(max-width:360px)]:text-[6.5px]">
        SOLUÇÕES DIGITAIS PARA NEGÓCIOS SEM GAMBIARRA
      </p>
      <h1
        id="hero-title"
        className="mt-[calc(26*var(--unit))] text-[calc(70*var(--unit))] font-extrabold leading-[0.93] tracking-[-0.067em] translate-y-[calc(4*var(--unit))] [@media(max-width:1100px)]:text-[clamp(53px,6.3vw,66px)] [@media(max-width:650px)]:mt-[34px] [@media(max-width:650px)]:text-[clamp(35px,8.55vw,53px)] [@media(max-width:650px)]:leading-[1] [@media(max-width:650px)]:tracking-[-0.065em] [@media(max-width:360px)]:text-[32px]"
      >
        <span className="block w-fit whitespace-nowrap bg-[linear-gradient(#fff_18%,#dedfe7_88%)] bg-clip-text [-webkit-text-fill-color:transparent] origin-left scale-x-[0.975]">
          Tecnologia que resolve
        </span>
        <span className="block w-fit whitespace-nowrap bg-[linear-gradient(#fff_18%,#dedfe7_88%)] bg-clip-text [-webkit-text-fill-color:transparent] origin-left scale-x-[0.945]">
          o que trava seu
        </span>
        <span className="block w-fit whitespace-nowrap text-vexiom-yellow tracking-[-0.078em] [@media(max-width:650px)]:tracking-[-0.075em]">
          negócio.
        </span>
      </h1>
      <p className="mt-[calc(32*var(--unit))] mr-0 mb-0 ml-[calc(2*var(--unit))] text-vexiom-gray-medium text-[calc(15*var(--unit))] font-[450] leading-[calc(22*var(--unit))] tracking-[-0.035em] [@media(max-width:1100px)]:mt-[32px] [@media(max-width:1100px)]:text-[14px] [@media(max-width:1100px)]:leading-[22px] [@media(max-width:650px)]:mt-[30px] [@media(max-width:650px)]:ml-0 [@media(max-width:650px)]:text-[12px] [@media(max-width:650px)]:leading-[1.8] [@media(max-width:650px)]:[&_br]:hidden">
        Criamos sites, sistemas, lojas virtuais e automações
        <br />
        sob medida para autônomos, pequenas empresas e startups.
        <br />
        Sem complexidade desnecessária. Mais espaço para crescer.
      </p>
      <HeroActions />
      <SolutionShortcuts />
    </div>
  )
}
