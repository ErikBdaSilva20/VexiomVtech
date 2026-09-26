"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { HEADER_CTA, NAV_ITEMS } from "@/data/home-content"
import { PrimaryNav } from "@/components/primary-nav"
import { ArrowLink } from "@/components/shared/arrow-link"

const HEADER_HEIGHT_CLASSES = "h-[calc(64*var(--unit))] [@media(max-width:1100px)]:h-[64px] [@media(max-width:650px)]:h-[64px] [@media(max-width:360px)]:h-[52px]"

/**
 * Keep the same header/menu in the DOM when pinning. CSS keyframes give
 * the fixed header an off-screen first frame without a reveal render or
 * a transition that accidentally animates the move INTO the hidden state.
 * Unpinning removes the animation immediately; only a new pin replays it.
 */
export function SiteHeader() {
  const menuRef = useRef<HTMLDetailsElement>(null)
  const triggerRef = useRef<HTMLElement>(null)
  const headerRef = useRef<HTMLElement>(null)
  const [isPinned, setIsPinned] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const showBackButton = pathname !== "/"

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    // Hysteresis prevents repeated entrances while scrolling near the edge.
    const UNPIN_MARGIN = 24
    let pinned = false
    let frame = 0

    function updatePinned() {
      frame = 0
      const threshold = header!.getBoundingClientRect().height
      const nextPinned = window.scrollY > threshold - (pinned ? UNPIN_MARGIN : 0)
      if (nextPinned === pinned) return

      if (nextPinned) {
        // scrollHeight includes the hanging logo, notch and any open menu.
        // One extra pixel clears the SVG stroke, without an oversized slide.
        header!.style.setProperty("--header-entry-offset", `${-header!.scrollHeight - 1}px`)
      }
      pinned = nextPinned
      setIsPinned(nextPinned)
    }

    function handleScroll() {
      if (!frame) frame = requestAnimationFrame(updatePinned)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    window.addEventListener("resize", handleScroll)
    handleScroll()
    return () => {
      window.removeEventListener("scroll", handleScroll)
      window.removeEventListener("resize", handleScroll)
      cancelAnimationFrame(frame)
    }
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
        className={`site-header ${HEADER_HEIGHT_CLASSES} bg-[linear-gradient(115deg,#101110ed,#090a09f5)] ${
          isPinned
            ? "fixed top-0 left-0 z-20 w-full shadow-[0_calc(10*var(--unit))_calc(30*var(--unit))_#000000b3] animate-[header-enter_1000ms_ease-in-out_both] will-change-transform"
            : "relative z-[5]"
        }`}
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
          {/* Subtle history-back shortcut - mobile only, and only once there's
              somewhere to go back to (hidden on the home page itself). Sits
              on the left, clear of the centered wordmark and the hamburger. */}
          {showBackButton && (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              className="hidden [@media(max-width:650px)]:grid absolute left-[21px] top-1/2 z-10 h-[36px] w-[36px] -translate-y-1/2 place-items-center text-[#9a9d97] transition-colors hover:text-vexiom-yellow"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-[18px] w-[18px] fill-none stroke-current"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
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
              simple centering - still centered at 650px too, now that the
              wordmark replaces the compact "V" there (plenty of clearance
              from the hamburger on the right). */}
          <div className="absolute left-1/2 top-[calc(24*var(--unit))] z-10 -translate-x-1/2 pointer-events-none [@media(max-width:1100px)]:top-1/2 [@media(max-width:1100px)]:-translate-y-1/2">
            <Link
              href="/"
              aria-label="Vexiom, voltar ao início"
              className="block w-[calc(100*var(--unit))] pointer-events-auto [@media(max-width:1100px)]:w-[50px] [@media(max-width:650px)]:hidden"
            >
              <Image
                className="brand-image"
                src="/assets/vexiomV.png"
                alt="Vexiom"
                width={1536}
                height={1024}
                priority
              />
            </Link>
            {/* Below 650px the compact "V" gives way to the full wordmark - the
                mobile menu no longer competes for space with a wide nav, so there's
                room, and it reads better than a lone glyph at a glance. */}
            <Link
              href="/"
              aria-label="Vexiom, voltar ao início"
              className="hidden pointer-events-auto [@media(max-width:650px)]:block [@media(max-width:650px)]:w-[208px] [@media(max-width:650px)]:translate-y-[7px] [@media(max-width:360px)]:w-[160px]"
            >
              <svg
                className="w-full h-auto [aspect-ratio:680/110]"
                viewBox="0 0 680 110"
                role="img"
                aria-label="Vexiom"
              >
                <use href="#brand-mark" width="680" height="110" />
              </svg>
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
          className={`site-header-spacer ${HEADER_HEIGHT_CLASSES}`}
          aria-hidden="true"
        />
      )}
    </>
  )
}
