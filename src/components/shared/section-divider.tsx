type SectionDividerProps = {
  /**
   * "ltr" (padrão): segmento esquerdo alto, desce em direção à direita.
   * "rtl": espelhado — segmento direito alto, desce em direção à esquerda.
   */
  direction?: "ltr" | "rtl"
  className?: string
}

/** Decorativo accent diagonal em "degrau", reutilizável para separar seções. */
export function SectionDivider({ direction = "ltr", className }: SectionDividerProps) {
  const classes = [
    "relative w-full [--step-run:calc(72*var(--unit))] [--step-length:calc(var(--step-run)/cos(20deg))] [--step-drop:calc(var(--step-run)*tan(20deg))] h-[calc(var(--step-drop)+2*var(--unit))] [@media(max-width:1100px)]:[--step-run:56px] [@media(max-width:650px)]:[--step-run:40px]",
    direction === "rtl" && "-scale-x-100",
    className,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={classes} aria-hidden="true">
      <span className="absolute top-0 left-0 w-1/2 h-[calc(2*var(--unit))] bg-vexiom-yellow" />
      <span className="absolute top-0 left-1/2 w-[var(--step-length)] h-[calc(2*var(--unit))] bg-vexiom-yellow origin-top-left rotate-[20deg]" />
      <span className="absolute top-[var(--step-drop)] left-[calc(50%+var(--step-run))] right-0 h-[calc(2*var(--unit))] bg-vexiom-yellow" />
    </div>
  )
}
