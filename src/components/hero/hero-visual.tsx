/** Large brand mark plus the two decorative "hero-note" captions. */
export function HeroVisual() {
  return (
    <>
      <div className="hero-brand">
        <svg
          className="brand-image"
          viewBox="0 0 680 110"
          role="img"
          aria-label="Vexiom"
        >
          <use href="#brand-mark" width="680" height="110" />
        </svg>
      </div>
      <p className="hero-note hero-note-top">
        IDEIAS
        <br />
        SISTEMAS
        <br />
        RESULTADOS
      </p>
      <p className="hero-note hero-note-bottom">
        TECNOLOGIA
        <br />
        PARA O QUE VEM
        <br />
        A SEGUIR
      </p>
    </>
  )
}
