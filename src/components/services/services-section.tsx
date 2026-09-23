import { SERVICES } from "@/data/home-content"
import { ServiceCard } from "@/components/services/service-card"

/** Services section — intro column, 4-card grid, and the "services-note" caption. */
export function ServicesSection() {
  return (
    <section
      className="services"
      id="servicos"
      aria-labelledby="services-title"
    >
      <div className="services-layout">
        <div className="services-intro">
          <p className="services-eyebrow">
            DO PROBLEMA
            <br />
            À SOLUÇÃO
          </p>
          <h2 id="services-title">
            Soluções
            <br />
            com propósito.
          </h2>
        </div>
        <div className="service-grid">
          {SERVICES.map((service) => (
            <ServiceCard key={service.href} service={service} />
          ))}
        </div>
        <p className="services-note">
          INOVAÇÃO
          <br />
          QUE GERA
          <br />
          MOVIMENTO
        </p>
      </div>
    </section>
  )
}
