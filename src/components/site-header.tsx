"use client"

import { useEffect, useRef, useState } from "react"
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
 *
 * The header also pins itself to the viewport once the page scrolls past
 * its own height, sliding down into place, and un-pins again on the way
 * back — so the slide-in replays every time the threshold is crossed
 * going down, not just once per page load.
 */
export function SiteHeader() {
  const menuRef = useRef<HTMLDetailsElement>(null)
  const triggerRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const headerHeightRef = useRef(0)
  const [isPinned, setIsPinned] = useState(false)
  const [headerHeight, setHeaderHeight] = useState(0)

  useEffect(() => {
    if (!headerRef.current) return
    headerHeightRef.current = headerRef.current.offsetHeight
    setHeaderHeight(headerRef.current.offsetHeight)
  }, [])

  useEffect(() => {
    // A small gap between the pin/unpin thresholds avoids rapid toggling
    // (and re-triggering the entrance animation) while the scroll position
    // sits right at the boundary.
    const UNPIN_MARGIN = 24
    let ticking = false

    function handleScroll() {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const threshold = headerHeightRef.current
        setIsPinned((wasPinned) => {
          if (wasPinned) return window.scrollY > threshold - UNPIN_MARGIN
          return window.scrollY > threshold
        })
        ticking = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

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
    <>
      <header
        ref={headerRef}
        className={
          isPinned
            ? "fixed top-0 left-0 z-20 w-full h-[calc(64*var(--unit))] bg-[linear-gradient(115deg,#101110ed,#090a09f5)] shadow-[0_calc(10*var(--unit))_calc(30*var(--unit))_#000000b3] animate-[site-header-descend_1s_cubic-bezier(0.65,0,0.35,1)_both] [@media(max-width:1100px)]:h-[64px] [@media(max-width:650px)]:h-[64px] [@media(max-width:360px)]:h-[52px]"
            : "relative z-[5] h-[calc(64*var(--unit))] bg-[linear-gradient(115deg,#101110ed,#090a09f5)] [@media(max-width:1100px)]:h-[64px] [@media(max-width:650px)]:h-[64px] [@media(max-width:360px)]:h-[52px]"
        }
      >
        <div
          className="absolute top-full left-0 w-full h-[calc(48*var(--unit))] bg-[#0a0b0a] [clip-path:polygon(41.6875%_0%,58.3125%_0%,55.3125%_100%,44.6875%_100%)] z-[1] pointer-events-none [@media(max-width:1100px)]:hidden"
          aria-hidden="true"
        />
        <svg
          className="absolute bottom-[calc(-48*var(--unit))] left-0 w-full h-[calc(49*var(--unit))] overflow-visible pointer-events-none z-[2] [@media(max-width:1100px)]:hidden"
          viewBox="0 0 1600 49"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 0.5h667l48 48h170l48-48h667"
            fill="none"
            stroke="#73704d"
            strokeWidth="1"
          />
          <path d="m667 .5 48 48h170l48-48" stroke="#c6aa12" />
        </svg>
        <div className="relative flex justify-between items-center h-full py-0 pr-[calc(68*var(--unit))] pl-[calc(94*var(--unit))] [@media(max-width:1100px)]:pr-[28px] [@media(max-width:1100px)]:pl-[28px] [@media(max-width:650px)]:pr-[21px] [@media(max-width:650px)]:pl-[21px] before:content-[''] before:absolute before:top-[calc(54*var(--unit))] before:h-px before:[background:linear-gradient(90deg,#ffffff03,#ffffff13,#ffffff05)] before:left-[calc(82*var(--unit))] before:w-[calc(648*var(--unit))] [@media(max-width:1100px)]:before:top-[40px] [@media(max-width:1100px)]:before:w-[42%] [@media(max-width:1100px)]:before:left-[28px] [@media(max-width:650px)]:before:left-[21px] [@media(max-width:650px)]:before:w-[41%] after:content-[''] after:absolute after:top-[calc(54*var(--unit))] after:h-px after:[background:linear-gradient(90deg,#ffffff03,#ffffff13,#ffffff05)] after:right-[calc(67*var(--unit))] after:w-[calc(663*var(--unit))] [@media(max-width:1100px)]:after:top-[40px] [@media(max-width:1100px)]:after:w-[42%] [@media(max-width:1100px)]:after:right-[28px] [@media(max-width:650px)]:after:right-[21px] [@media(max-width:650px)]:after:w-[20%]">
          <PrimaryNav
            items={NAV_ITEMS}
            ariaLabel="Navegação principal"
            variant="desktop"
            className="flex items-center gap-[calc(43*var(--unit))] h-full [@media(max-width:1100px)]:hidden"
          />
          <details
            className="hidden [@media(max-width:1100px)]:relative [@media(max-width:1100px)]:block [@media(max-width:1100px)]:mt-[4px] [@media(max-width:650px)]:ml-auto"
            ref={menuRef}
          >
            <summary
              ref={triggerRef}
              aria-label="Menu de navegação"
              className="[@media(max-width:1100px)]:grid [@media(max-width:1100px)]:w-[44px] [@media(max-width:1100px)]:h-[44px] [@media(max-width:1100px)]:items-center [@media(max-width:1100px)]:list-none [@media(max-width:1100px)]:cursor-pointer [@media(max-width:1100px)]:text-vexiom-yellow [@media(max-width:1100px)]:[&::-webkit-details-marker]:hidden [@media(max-width:650px)]:justify-end"
            >
              <svg className="icon" aria-hidden="true">
                <use href="#menu" />
              </svg>
            </summary>
            <PrimaryNav
              items={NAV_ITEMS}
              ariaLabel="Navegação para celular"
              className="[@media(max-width:1100px)]:absolute [@media(max-width:1100px)]:z-[8] [@media(max-width:1100px)]:top-[54px] [@media(max-width:1100px)]:left-0 [@media(max-width:1100px)]:w-[225px] [@media(max-width:1100px)]:p-[12px] [@media(max-width:1100px)]:border [@media(max-width:1100px)]:border-[#393b33] [@media(max-width:1100px)]:bg-[#11130f] [@media(max-width:1100px)]:shadow-[0_15px_35px_#0009] [@media(max-width:650px)]:left-auto [@media(max-width:650px)]:right-0"
            />
          </details>
          {/* Brand mark hangs down out of the header, nested inside the
              V-notch cut into the bottom border (the two decorative
              elements above). Centered horizontally; vertical offset is
              hand-tuned so the mark's own V lines up with the notch.
              Below 1100px the notch is hidden, so the mark falls back to
              simple centering (or left-aligned once the mobile menu takes
              over the center-right area at 650px). */}
          <div className="absolute left-1/2 top-[calc(24*var(--unit))] z-10 -translate-x-1/2 pointer-events-none [@media(max-width:1100px)]:top-1/2 [@media(max-width:1100px)]:-translate-y-1/2 [@media(max-width:650px)]:left-[21px] [@media(max-width:650px)]:translate-x-0">
            <Link
              href="/"
              aria-label="Vexiom, voltar ao início"
              className="block w-[calc(100*var(--unit))] pointer-events-auto [@media(max-width:1100px)]:w-[50px] [@media(max-width:650px)]:w-[56px] [@media(max-width:360px)]:w-[46px]"
            >
              <Image
                className="brand-image"
                src="/assets/vTechWhiteTransparent.png"
                alt="Vexiom"
                width={200}
                height={250}
                priority
              />
            </Link>
          </div>
          <ArrowLink
            className="relative isolate inline-flex items-center justify-center gap-[calc(10*var(--unit))] w-[calc(211*var(--unit))] h-[calc(37*var(--unit))] mt-[calc(8*var(--unit))] pl-[calc(18*var(--unit))] text-vexiom-yellow text-[calc(13*var(--unit))] font-bold tracking-[-0.035em] before:content-[''] before:absolute before:inset-0 before:z-[-2] before:[clip-path:polygon(0_0,100%_0,100%_100%,14%_100%)] before:bg-[#e2cc12] after:content-[''] after:absolute after:inset-[calc(1.3*var(--unit))] after:z-[-1] after:[clip-path:polygon(0_0,100%_0,100%_100%,14%_100%)] after:bg-[#090a09] hover:after:bg-[#29250b] [@media(max-width:1100px)]:w-[177px] [@media(max-width:1100px)]:h-[35px] [@media(max-width:1100px)]:text-[11px] [@media(max-width:1100px)]:mt-[4px] [@media(max-width:650px)]:hidden"
            arrowClassName="w-[calc(14*var(--unit))] h-[calc(14*var(--unit))] flex-none fill-none stroke-current [stroke-width:2.2] [stroke-linecap:round] [stroke-linejoin:round]"
            href={HEADER_CTA.href}
          >
            {HEADER_CTA.label}
          </ArrowLink>
        </div>
      </header>
      {isPinned && (
        <div
          className="site-header-spacer"
          style={{ height: headerHeight }}
          aria-hidden="true"
        />
      )}
    </>
  )
}
