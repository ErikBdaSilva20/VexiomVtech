import { HeroActions } from "@/components/hero/hero-actions"
import { HERO_STATS } from "@/data/home-content"

/** Eyebrow, headline, description, CTAs and stats — the .hero-copy column. */
export function HeroContent() {
  return (
    <div className="hero-copy">
      <p className="eyebrow">SOLUÇÕES DIGITAIS COM DIREÇÃO CLARA</p>
      <h1 id="hero-title">
        <span className="light-text">Tecnologia</span>
        <span className="light-text">projetada para</span>
        <span className="accent">acelerar negócios.</span>
      </h1>
      <p className="hero-description">
        Sites, sistemas, lojas online e automações com IA
        <br />
        desenvolvidos a partir do que você realmente precisa.
        <br />
        Menos complexidade. Mais resultado.
      </p>
      <HeroActions />
      <dl
        className="stats"
        aria-label="Indicadores apresentados na referência"
      >
        {HERO_STATS.map((stat) => (
          <div className="stat" key={`${stat.value}-${stat.label}`}>
            <dt>{stat.value}</dt>
            <dd>{stat.label}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
