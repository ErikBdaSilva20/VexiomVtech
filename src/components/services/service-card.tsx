import type { ServiceItem } from "@/data/home-content"
import { ArrowLink } from "@/components/shared/arrow-link"

interface ServiceCardProps {
  service: ServiceItem
}

/** One service card — icon, title, two-line description, arrow. The
 * "Sistemas Sob Medida" card additionally carries the .featured accent bar. */
export function ServiceCard({ service }: ServiceCardProps) {
  return (
    <ArrowLink
      className={service.featured ? "service-card featured" : "service-card"}
      href={service.href}
      arrowClassName="icon card-arrow"
    >
      <svg className="icon service-icon" aria-hidden="true">
        <use href={`#${service.icon}`} />
      </svg>
      <h3>{service.title}</h3>
      <p>
        {service.description[0]}
        <br />
        {service.description[1]}
      </p>
    </ArrowLink>
  )
}
