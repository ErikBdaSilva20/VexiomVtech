"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import type { NavItem } from "@/data/home-content"
import { isInternalHref } from "@/lib/href"

interface PrimaryNavProps {
  items: NavItem[]
  ariaLabel: string
  className?: string
}

/** "/" only matches the home page itself; every other route also matches
 * its own sub-routes (e.g. "/blog" stays active on "/blog/my-post"). */
function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Renders the nav item list — real links for every item, each marked
 * aria-current="page" when it matches the current route. Shared between
 * the desktop nav and the mobile menu's nav so the item markup only
 * exists once.
 */
export function PrimaryNav({ items, ariaLabel, className }: PrimaryNavProps) {
  const pathname = usePathname()

  return (
    <nav className={className} aria-label={ariaLabel}>
      {items.map((item) => {
        const current = isActive(pathname, item.href) ? "page" : undefined

        return isInternalHref(item.href) ? (
          <Link key={item.href} href={item.href} aria-current={current}>
            {item.label}
          </Link>
        ) : (
          <a key={item.href} href={item.href} aria-current={current}>
            {item.label}
          </a>
        )
      })}
    </nav>
  )
}
