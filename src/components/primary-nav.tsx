"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { NavItem } from "@/data/home-content"
import { isInternalHref } from "@/lib/href"

interface PrimaryNavProps {
  items: NavItem[]
  ariaLabel: string
  className?: string
  /** "desktop" styles each link for the always-visible top nav (active
   * underline via ::after, hover color); "mobile" styles each link for the
   * <details> dropdown list (block row, padding, smaller font) — both only
   * take effect at/under the 1100px breakpoint where that instance is
   * actually shown. Defaults to "mobile" since that's the shared/no-frills
   * shape. */
  variant?: "desktop" | "mobile"
}

/** "/" only matches the home page itself; every other route also matches
 * its own sub-routes (e.g. "/blog" stays active on "/blog/my-post"). */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

const desktopLinkClassName =
  "relative flex items-center h-full pt-[calc(10*var(--unit))] text-[calc(12.5*var(--unit))] font-[550] tracking-[-0.045em] whitespace-nowrap hover:text-vexiom-yellow aria-[current=page]:after:content-[''] aria-[current=page]:after:absolute aria-[current=page]:after:left-0 aria-[current=page]:after:bottom-[calc(14*var(--unit))] aria-[current=page]:after:w-full aria-[current=page]:after:h-[calc(2*var(--unit))] aria-[current=page]:after:bg-vexiom-yellow"

const mobileLinkClassName =
  "[@media(max-width:1100px)]:block [@media(max-width:1100px)]:p-[12px] [@media(max-width:1100px)]:text-[13px] [@media(max-width:1100px)]:hover:text-vexiom-yellow [@media(max-width:1100px)]:aria-[current=page]:text-vexiom-yellow"

/**
 * Renders the nav item list — real links for every item, each marked
 * aria-current="page" when it matches the current route. Shared between
 * the desktop nav and the mobile menu's nav so the item markup only
 * exists once; `variant` picks which of the two link looks applies.
 */
export function PrimaryNav({
  items,
  ariaLabel,
  className,
  variant = "mobile",
}: PrimaryNavProps) {
  const pathname = usePathname()
  const linkClassName =
    variant === "desktop" ? desktopLinkClassName : mobileLinkClassName

  return (
    <nav className={className} aria-label={ariaLabel}>
      {items.map((item) => {
        const current = isActive(pathname, item.href) ? "page" : undefined

        return isInternalHref(item.href) ? (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current}
            className={linkClassName}
          >
            {item.label}
          </Link>
        ) : (
          <a
            key={item.href}
            href={item.href}
            aria-current={current}
            className={linkClassName}
          >
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
