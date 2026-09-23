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
  const classes = ["section-divider", direction === "rtl" && "section-divider--rtl", className]
    .filter(Boolean)
    .join(" ")

  return (
    <div className={classes} aria-hidden="true">
      <span className="divider-segment divider-segment-left" />
      <span className="divider-segment divider-segment-slope" />
      <span className="divider-segment divider-segment-right" />
    </div>
  )
}
