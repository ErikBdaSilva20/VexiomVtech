/** Large brand mark plus the two decorative "hero-note" captions. */
export function HeroVisual() {
  return (
    <>
      {/* Hidden on mobile: the header now carries the full wordmark there instead
          (see site-header.tsx), so repeating it here would just be noise. */}
      <div className="absolute z-[1] top-[calc(-60*var(--unit))] left-[calc(838*var(--unit))] w-[calc(640*var(--unit))] [filter:drop-shadow(0_calc(5*var(--unit))_calc(4*var(--unit))_#0009)] [@media(max-width:1100px)]:top-auto [@media(max-width:1100px)]:bottom-[34px] [@media(max-width:1100px)]:left-auto [@media(max-width:1100px)]:right-[5%] [@media(max-width:1100px)]:w-[46%] [@media(max-width:650px)]:hidden">
        <svg
          className="brand-image"
          viewBox="0 0 680 110"
          role="img"
          aria-label="Vexiom"
        >
          <use href="#brand-mark" width="680" height="110" />
        </svg>
      </div>
      <p className="absolute text-[#c1c1c6] text-[calc(10*var(--unit))] font-[550] leading-[1.85] tracking-[0.2em] uppercase top-[calc(40*var(--unit))] right-[calc(34*var(--unit))] pr-[calc(20*var(--unit))] border-r-[calc(2*var(--unit))] border-r-vexiom-yellow text-right [@media(max-width:1100px)]:top-[36px] [@media(max-width:1100px)]:right-[25px] [@media(max-width:1100px)]:text-[8px] [@media(max-width:650px)]:hidden">
        IDEIAS
        <br />
        SISTEMAS
        <br />
        RESULTADOS
      </p>
      <p className="absolute text-[#c1c1c6] font-[550] leading-[1.85] uppercase right-[calc(30*var(--unit))] bottom-[calc(54*var(--unit))] pl-[calc(20*var(--unit))] border-l-[calc(2*var(--unit))] border-l-vexiom-yellow text-[calc(9*var(--unit))] tracking-[0.13em] [@media(max-width:1100px)]:right-auto [@media(max-width:1100px)]:left-[5%] [@media(max-width:1100px)]:bottom-[38px] [@media(max-width:1100px)]:text-[8px] [@media(max-width:650px)]:left-auto [@media(max-width:650px)]:right-[22px] [@media(max-width:650px)]:bottom-[24px] [@media(max-width:650px)]:text-[7px] [@media(max-width:650px)]:leading-[1.6] [@media(max-width:650px)]:pl-[12px]">
        TECNOLOGIA
        <br />
        PARA O QUE VEM
        <br />
        A SEGUIR
      </p>
    </>
  )
}
