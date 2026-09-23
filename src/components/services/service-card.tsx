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
      className={[
        "relative block min-h-[calc(160*var(--unit))] pt-[calc(21*var(--unit))] px-[calc(26*var(--unit))] pb-[calc(31*var(--unit))] border border-[#292b28] rounded-[calc(4*var(--unit))] bg-[linear-gradient(125deg,#1113106b,#10110f3b)] shadow-[inset_0_0_0_1px_#ffffff02] transition-colors duration-[180ms] hover:border-[#8b7b17] hover:bg-[#1c1d15]",
        "[@media(max-width:1100px)]:min-h-[169px] [@media(max-width:1100px)]:px-[16px] [@media(max-width:650px)]:min-h-[178px] [@media(max-width:650px)]:pt-[20px] [@media(max-width:650px)]:px-[16px] [@media(max-width:650px)]:pb-[30px] [@media(max-width:360px)]:px-[13px]",
        service.featured
          ? "before:content-[''] before:absolute before:top-[calc(20*var(--unit))] before:left-[-1px] before:w-[calc(3*var(--unit))] before:h-[calc(47*var(--unit))] before:bg-vexiom-yellow before:shadow-[0_0_calc(9*var(--unit))_#ffe10b17]"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
      href={service.href}
      arrowClassName="absolute right-[calc(19*var(--unit))] bottom-[calc(12*var(--unit))] w-[calc(15*var(--unit))] h-[calc(15*var(--unit))] flex-none fill-none stroke-current text-vexiom-yellow [stroke-width:2] [stroke-linecap:round] [stroke-linejoin:round]"
    >
      <svg
        className="w-[calc(26*var(--unit))] h-[calc(26*var(--unit))] mb-[calc(11*var(--unit))] flex-none fill-none stroke-current text-vexiom-yellow [stroke-width:1.8] [stroke-linecap:round] [stroke-linejoin:round] [@media(max-width:650px)]:mb-[15px]"
        aria-hidden="true"
      >
        <use href={`#${service.icon}`} />
      </svg>
      <h3 className="mb-[calc(7*var(--unit))] text-[calc(13.5*var(--unit))] font-bold leading-[calc(19*var(--unit))] tracking-[-0.04em] whitespace-nowrap [@media(max-width:1100px)]:whitespace-normal [@media(max-width:1100px)]:text-[12px] [@media(max-width:650px)]:text-[12px] [@media(max-width:360px)]:text-[11px]">
        {service.title}
      </h3>
      <p className="text-[#c6c6c8] text-[calc(13*var(--unit))] font-[450] leading-[calc(21*var(--unit))] tracking-[-0.045em] whitespace-nowrap [@media(max-width:1100px)]:whitespace-normal [@media(max-width:1100px)]:text-[11px] [@media(max-width:1100px)]:leading-[19px] [@media(max-width:650px)]:text-[11px] [@media(max-width:650px)]:leading-[1.6]">
        {service.description[0]}
        <br className="[@media(max-width:650px)]:hidden" />
        {service.description[1]}
      </p>
    </ArrowLink>
  )
}
