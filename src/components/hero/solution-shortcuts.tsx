const solutions = [
  {
    description: "Menos tarefas repetitivas e mais tempo para avançar.",
    href: "#o-que-resolvemos",
    title: "Automações com IA",
  },
  {
    description: "Sites e sistemas feitos para o seu jeito de trabalhar.",
    href: "#o-que-resolvemos",
    title: "Sites e sistemas sob medida",
  },
  {
    description: "Venda pela internet com uma experiência mais simples.",
    href: "#o-que-resolvemos",
    title: "Lojas virtuais",
  },
] as const

/** Atalhos concisos para as frentes de trabalho, no lugar de métricas fictícias. */
export function SolutionShortcuts() {
  return (
    <nav
      className="relative grid grid-cols-3 w-[calc(605*var(--unit))] mt-[calc(42*var(--unit))] [border-block:1px_solid_#363a36] [@media(max-width:650px)]:grid-cols-1 [@media(max-width:650px)]:w-full [@media(max-width:650px)]:mt-[52px]"
      id="solucoes"
      aria-label="Soluções da Vexiom"
    >
      <span className="absolute bottom-[calc(100%_+_14*var(--unit))] left-0 text-[#d4d7d2] text-[calc(9*var(--unit))] font-[650] tracking-[0.18em] uppercase">
        O que fazemos
      </span>
      {solutions.map((solution, index) => (
        <a
          className={[
            "group relative grid [grid-template-areas:'index_arrow'_'copy_copy'] grid-cols-[1fr_auto] content-between min-h-[calc(112*var(--unit))] pt-[calc(17*var(--unit))] pr-[calc(16*var(--unit))] pb-[calc(15*var(--unit))] pl-0",
            "[@media(max-width:650px)]:[grid-template-areas:'index_copy_arrow'] [@media(max-width:650px)]:grid-cols-[30px_minmax(0,1fr)_auto] [@media(max-width:650px)]:gap-[12px] [@media(max-width:650px)]:items-start [@media(max-width:650px)]:min-h-0 [@media(max-width:650px)]:px-[4px] [@media(max-width:650px)]:py-[17px]",
            index > 0
              ? "pl-[calc(17*var(--unit))] border-l border-l-[#3a3f3a] before:content-[''] before:absolute before:top-[-1px] before:left-[-2px] before:w-[3px] before:h-[calc(18*var(--unit))] before:bg-vexiom-yellow before:[clip-path:polygon(0_0,100%_0,100%_78%,0_100%)] [@media(max-width:650px)]:pl-[4px] [@media(max-width:650px)]:border-t [@media(max-width:650px)]:border-t-[#303530] [@media(max-width:650px)]:border-l-0 [@media(max-width:650px)]:before:top-[-2px] [@media(max-width:650px)]:before:left-0 [@media(max-width:650px)]:before:w-[19px] [@media(max-width:650px)]:before:h-[3px]"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          href={solution.href}
          key={solution.title}
        >
          <span className="[grid-area:index] text-[#8f948e] text-[calc(9*var(--unit))] font-bold tracking-[0.16em]">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="[grid-area:copy]">
            <strong className="block text-[#f2f2f3] text-[calc(14*var(--unit))] font-[680] leading-[1.25] tracking-[-0.025em] group-hover:text-vexiom-yellow">
              {solution.title}
            </strong>
            <small className="block mt-[calc(10*var(--unit))] text-[#979c96] text-[calc(11*var(--unit))] leading-[1.45]">
              {solution.description}
            </small>
          </span>
          <svg
            className="[grid-area:arrow] w-[calc(14*var(--unit))] h-[calc(14*var(--unit))] text-vexiom-yellow fill-none stroke-current [stroke-width:2.2]"
            aria-hidden="true"
          >
            <use href="#arrow" />
          </svg>
        </a>
      ))}
    </nav>
  )
}
