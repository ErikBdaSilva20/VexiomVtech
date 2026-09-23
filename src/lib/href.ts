/**
 * True for links Next.js should client-side route (`/sobre`, `/`), false
 * for anything the browser must handle natively (hash anchors, mailto:,
 * tel:, external URLs). Shared by every link component so the internal-vs-
 * native distinction is defined once.
 */
export function isInternalHref(href: string): boolean {
  return href.startsWith("/")
}
