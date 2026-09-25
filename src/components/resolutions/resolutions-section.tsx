import { RESOLUTIONS } from "@/data/home-content"

/**
 * Third Home section. It replaces the former service-card grid with an
 * outcome-led diagnosis: what improves in the client's day-to-day work.
 */
export function ResolutionsSection() {
  return (
    <section
      className="relative overflow-hidden [background:linear-gradient(104deg,#10120f_0%,#0b0c0b_61%,#15150f_100%)] before:content-[''] before:absolute before:top-0 before:right-[calc(7*var(--unit))] before:w-[min(36vw,calc(570*var(--unit)))] before:h-full before:border-r before:border-r-[#fbd02010] before:border-l before:border-l-[#fbd0200b] before:[clip-path:polygon(24%_0,100%_0,76%_100%,0_100%)] before:pointer-events-none [@media(max-width:650px)]:before:right-[-90px] [@media(max-width:650px)]:before:w-[75vw]"
      id="o-que-resolvemos"
      aria-labelledby="resolutions-title"
    >
      <div className="relative grid grid-cols-[minmax(0,calc(440*var(--unit)))_minmax(0,1fr)] gap-[calc(92*var(--unit))] w-[min(100%,calc(1412*var(--unit)))] mx-auto px-[calc(56*var(--unit))] pt-[calc(88*var(--unit))] pb-[calc(94*var(--unit))] [@media(max-width:1100px)]:grid-cols-[minmax(240px,0.62fr)_minmax(0,1fr)] [@media(max-width:1100px)]:gap-[48px] [@media(max-width:1100px)]:px-[5%] [@media(max-width:1100px)]:pt-[70px] [@media(max-width:1100px)]:pb-[74px] [@media(max-width:650px)]:grid-cols-[1fr] [@media(max-width:650px)]:gap-[48px] [@media(max-width:650px)]:px-[21px] [@media(max-width:650px)]:pt-[58px] [@media(max-width:650px)]:pb-[60px] [@media(max-width:360px)]:px-[17px]">
        <div className="self-start pt-[calc(8*var(--unit))] [@media(max-width:650px)]:max-w-[470px] [@media(max-width:650px)]:pt-0">
          <p className="flex items-center gap-[calc(13*var(--unit))] text-[#c7c9c4] text-[calc(10*var(--unit))] font-[650] tracking-[0.18em] before:content-[''] before:w-[calc(29*var(--unit))] before:h-[calc(2*var(--unit))] before:bg-vexiom-yellow">
            O QUE MUDA NA PRÁTICA
          </p>
          <h2
            id="resolutions-title"
            className="mt-[calc(28*var(--unit))] text-[#f4f4f2] text-[calc(42*var(--unit))] font-[760] leading-[1.03] tracking-[-0.06em] [@media(max-width:1100px)]:text-[36px] [@media(max-width:650px)]:mt-[24px] [@media(max-width:650px)]:text-[33px] [@media(max-width:360px)]:text-[29px]"
          >
            O que muda quando a tecnologia
            <br />
            <span className="text-vexiom-yellow">trabalha a favor do negócio.</span>
          </h2>
          <p className="max-w-[calc(385*var(--unit))] mt-[calc(32*var(--unit))] text-[#afb1ae] text-[calc(15*var(--unit))] leading-[1.6] [@media(max-width:650px)]:mt-[24px] [@media(max-width:650px)]:text-[14px]">
            Cada projeto começa pelo ponto que está impedindo seu negócio de
            avançar — não por uma solução pronta ou tecnologia da moda.
          </p>

        </div>

        <ol className="relative grid m-0 p-0 list-none before:content-[''] before:absolute before:top-[calc(24*var(--unit))] before:bottom-[calc(24*var(--unit))] before:left-[calc(27*var(--unit))] before:w-px before:[background:linear-gradient(to_bottom,transparent,#fbd02083_9%,#fbd0202e_86%,transparent)] [@media(max-width:1100px)]:before:left-[21px] [@media(max-width:650px)]:before:top-[20px] [@media(max-width:650px)]:before:bottom-[20px] [@media(max-width:650px)]:before:left-[18px]">
          {RESOLUTIONS.map((resolution) => (
            <li
              className="relative grid grid-cols-[calc(78*var(--unit))_minmax(0,1fr)_minmax(calc(150*var(--unit)),calc(205*var(--unit)))] gap-[calc(20*var(--unit))] items-center min-h-[calc(126*var(--unit))] py-[calc(20*var(--unit))] border-t border-t-[#363834] transition-colors duration-200 last:border-b last:border-b-[#363834] before:content-[''] before:absolute before:top-[-1px] before:left-0 before:w-0 before:h-0.5 before:bg-vexiom-yellow before:transition-[width] before:duration-[250ms] hover:border-[#77742f] hover:before:w-[calc(65*var(--unit))] [@media(max-width:1100px)]:grid-cols-[58px_minmax(0,1fr)_minmax(135px,175px)] [@media(max-width:1100px)]:gap-[16px] [@media(max-width:1100px)]:min-h-[130px] [@media(max-width:650px)]:grid-cols-[48px_minmax(0,1fr)] [@media(max-width:650px)]:gap-[13px] [@media(max-width:650px)]:min-h-0 [@media(max-width:650px)]:pt-[25px] [@media(max-width:650px)]:pb-[24px]"
              key={resolution.index}
            >
              <span
                className="relative z-[1] grid items-center justify-items-start w-[calc(55*var(--unit))] h-[calc(32*var(--unit))] pl-[calc(13*var(--unit))] text-[#d4c436] text-[calc(11*var(--unit))] font-bold tracking-[0.13em] bg-[#12130f] [@media(max-width:1100px)]:w-[47px] [@media(max-width:1100px)]:pl-[10px] [@media(max-width:650px)]:w-[39px] [@media(max-width:650px)]:h-[28px] [@media(max-width:650px)]:pl-[7px] [@media(max-width:650px)]:text-[10px]"
                aria-hidden="true"
              >
                {resolution.index}
              </span>
              <div>
                <p className="mb-[calc(7*var(--unit))] text-[#c7b933] text-[calc(9*var(--unit))] font-bold tracking-[0.17em] uppercase">
                  {resolution.category}
                </p>
                <h3 className="m-0 text-[#f0f0ee] text-[calc(20*var(--unit))] font-[720] leading-[1.13] tracking-[-0.045em] [@media(max-width:1100px)]:text-[18px] [@media(max-width:650px)]:text-[19px] [@media(max-width:360px)]:text-[17px]">
                  {resolution.title}
                </h3>
                <p className="max-w-[calc(430*var(--unit))] mt-[calc(9*var(--unit))] text-[#a7aaa5] text-[calc(12*var(--unit))] leading-[1.52]">
                  {resolution.description}
                </p>
              </div>
              <p className="m-0 pl-[calc(18*var(--unit))] border-l border-l-[#575740] text-[#d9dad6] text-[calc(12*var(--unit))] font-semibold leading-[1.45] tracking-[-0.02em] [@media(max-width:650px)]:col-start-2 [@media(max-width:650px)]:mt-[2px] [@media(max-width:650px)]:pl-[12px] [@media(max-width:650px)]:text-[11.5px]">
                {resolution.outcome}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
