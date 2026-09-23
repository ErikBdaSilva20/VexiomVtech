"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"

import { HEADER_CTA, NAV_ITEMS } from "@/data/home-content"
import { PrimaryNav } from "@/components/primary-nav"
import { ArrowLink } from "@/components/shared/arrow-link"

/**
 * Header bar: desktop nav, centered brand mark, CTA, and a native
 * <details>-based mobile menu whose open/close behaviour is an exact port
 * of home-reference.html's vanilla script — opens via the browser's
 * default <summary> toggle, closes on link click (focus returns to the
 * trigger), Escape, outside click, or resize to ≥1101px.
 */
export function SiteHeader() {
  const menuRef = useRef<HTMLDetailsElement>(null)
  const triggerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const mobileMenu = menuRef.current
    const menuTrigger = triggerRef.current
    if (!mobileMenu || !menuTrigger) return

    function handleClick(event: MouseEvent) {
      const target = event.target as HTMLElement
      if (target.closest("a")) {
        mobileMenu!.open = false
        menuTrigger!.focus({ preventScroll: true })
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && mobileMenu!.open) {
        mobileMenu!.open = false
        menuTrigger!.focus()
      }
    }

    function handleOutsideClick(event: MouseEvent) {
      if (mobileMenu!.open && !mobileMenu!.contains(event.target as Node)) {
        mobileMenu!.open = false
      }
    }

    const desktopQuery = window.matchMedia("(min-width: 1101px)")
    function handleResize(event: MediaQueryListEvent) {
      if (event.matches) mobileMenu!.open = false
    }

    mobileMenu.addEventListener("click", handleClick)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("click", handleOutsideClick)
    desktopQuery.addEventListener("change", handleResize)

    return () => {
      mobileMenu.removeEventListener("click", handleClick)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("click", handleOutsideClick)
      desktopQuery.removeEventListener("change", handleResize)
    }
  }, [])

  return (
    <header className="site-header">
      <div className="header-notch" aria-hidden="true" />
      <svg
        className="header-outline"
        viewBox="0 0 1600 29"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M0 0.5h687l28 28h170l28-28h687"
          fill="none"
          stroke="#73704d"
          strokeWidth="1"
        />
        <path d="m687 .5 28 28h170l28-28" stroke="#c6aa12" />
      </svg>
      <div className="header-inner">
        <PrimaryNav
          items={NAV_ITEMS}
          ariaLabel="Navegação principal"
          className="desktop-nav"
        />
        <details className="mobile-menu" ref={menuRef}>
          <summary ref={triggerRef} aria-label="Menu de navegação">
            <svg className="icon" aria-hidden="true">
              <use href="#menu" />
            </svg>
          </summary>
          <PrimaryNav items={NAV_ITEMS} ariaLabel="Navegação para celular" />
        </details>
        <Link
          className="header-brand"
          href="/"
          aria-label="Vexiom, voltar ao início"
        >
          <Image
            className="brand-image"
            src="/assets/vTechWhiteTransparent.png"
            alt="Vexiom"
            width={208}
            height={208}
            priority
          />
        </Link>
        <ArrowLink className="header-cta" href={HEADER_CTA.href}>
          {HEADER_CTA.label}
        </ArrowLink>
      </div>
    </header>
  )
}
