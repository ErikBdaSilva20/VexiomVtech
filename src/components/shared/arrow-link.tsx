import type { ReactNode } from "react"
import Link from "next/link"

import { isInternalHref } from "@/lib/href"

interface ArrowLinkProps {
  href: string
  className: string
  /** Overrides the arrow icon's own class — service cards add "card-arrow"
   * for its absolute positioning, header/hero CTAs just use "icon". */
  arrowClassName?: string
  children: ReactNode
}

/**
 * The repeated "link + trailing arrow icon" shape from home-reference.html:
 * an <a> whose content is immediately followed by
 * `<svg class="icon ..."><use href="#arrow" /></svg>`. Used by the header
 * CTA, the hero primary button, and all 4 service cards — extracted here so
 * that markup only exists once, per the spec's componentization guidance.
 * Renders byte-identical DOM to the reference: only className/href/children
 * and the arrow's own class vary per call site.
 */
export function ArrowLink({
  href,
  className,
  arrowClassName = "icon",
  children,
}: ArrowLinkProps) {
  const arrow = (
    <svg className={arrowClassName} aria-hidden="true">
      <use href="#arrow" />
    </svg>
  )

  if (isInternalHref(href)) {
    return (
      <Link className={className} href={href}>
        {children}
        {arrow}
      </Link>
    )
  }

  return (
    <a className={className} href={href}>
      {children}
      {arrow}
    </a>
  )
}
