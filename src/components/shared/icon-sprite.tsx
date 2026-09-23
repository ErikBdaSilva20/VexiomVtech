/**
 * Hidden SVG sprite: the brand-mark crop (with its alpha filter) and every
 * icon symbol reused via <use> across the header, hero and service cards.
 * Copied 1:1 from home-reference.html's <defs>.
 */
export function IconSprite() {
  return (
    <svg
      width="0"
      height="0"
      aria-hidden="true"
      style={{ position: "absolute", overflow: "hidden" }}
    >
      <defs>
        <filter id="brand-alpha" colorInterpolationFilters="sRGB">
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 1 1 0 -0.43"
          />
        </filter>
        <symbol id="brand-mark" viewBox="860 362 680 110">
          <image
            href="/assets/vexiom-wordmark-reference.png"
            width="1672"
            height="941"
            filter="url(#brand-alpha)"
            aria-hidden="true"
          />
        </symbol>
        <symbol id="arrow" viewBox="0 0 24 24">
          <path d="M6 18 18 6M9 6h9v9" />
        </symbol>
        <symbol id="menu" viewBox="0 0 24 24">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </symbol>
        <symbol id="monitor" viewBox="0 0 28 28">
          <rect x="2" y="3" width="24" height="17" rx="1" />
          <path d="M14 20v5m-5 0h10" />
        </symbol>
        <symbol id="settings" viewBox="0 0 28 28">
          <path d="m12 2-.6 3a9 9 0 0 0-2.4 1L6.4 4.4 4.4 6.5 6 9a9 9 0 0 0-1 2.4L2 12v4l3 .6a9 9 0 0 0 1 2.4l-1.6 2.5 2.1 2.1L9 22a9 9 0 0 0 2.4 1l.6 3h4l.6-3a9 9 0 0 0 2.4-1l2.5 1.6 2.1-2.1L22 19a9 9 0 0 0 1-2.4l3-.6v-4l-3-.6A9 9 0 0 0 22 9l1.6-2.5-2.1-2.1L19 6a9 9 0 0 0-2.4-1L16 2z" />
          <circle cx="14" cy="14" r="4" />
        </symbol>
        <symbol id="cart" viewBox="0 0 28 28">
          <path d="M2 3h3l3 17h15l3-12H6M9 16h15" />
          <circle cx="10" cy="24" r="1" />
          <circle cx="22" cy="24" r="1" />
        </symbol>
        <symbol id="brain" viewBox="0 0 28 28">
          <path d="M11 5a4 4 0 0 0-7 3 4 4 0 0 0 1 7 4 4 0 0 0 2 7 4 4 0 0 0 4 1V5Zm6 0a4 4 0 0 1 7 3 4 4 0 0 1-1 7 4 4 0 0 1-2 7 4 4 0 0 1-4 1V5ZM11 10l-3 2m3 5-3-1m9-6 3 2m-3 5 3-1M14 3v22" />
        </symbol>
        <symbol id="clock" viewBox="0 0 28 28">
          <circle cx="14" cy="14" r="11" />
          <path d="M14 8v6l4 3" />
        </symbol>
        <symbol id="link" viewBox="0 0 24 24">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </symbol>
        <symbol id="trending-up" viewBox="0 0 28 28">
          <path d="M3 20 11 12 16 17 25 7" />
          <path d="M18 7h7v7" />
        </symbol>
        <symbol id="message-circle" viewBox="0 0 24 24">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </symbol>
        <symbol id="compass" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </symbol>
        <symbol id="code" viewBox="0 0 24 24">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </symbol>
        <symbol id="shield-check" viewBox="0 0 24 24">
          <path d="M12 2 4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5z" />
          <path d="m9 12 2 2 4-4" />
        </symbol>
      </defs>
    </svg>
  )
}
