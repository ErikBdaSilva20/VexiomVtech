/**
 * Full-bleed decorative SVG art positioned behind the header/hero, copied
 * 1:1 from home-reference.html (no invented imagery — purely a port of
 * the reference's own vector artwork and gradients).
 */
export function BackgroundArt() {
  return (
    <svg
      className="background-art"
      viewBox="0 0 1600 900"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient
          id="base-light"
          x1="300"
          y1="70"
          x2="640"
          y2="810"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#111211" />
          <stop offset=".52" stopColor="#090b0a" />
          <stop offset="1" stopColor="#0b0d0c" />
        </linearGradient>
        <linearGradient
          id="panel-light"
          x1="1030"
          y1="83"
          x2="915"
          y2="720"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#282929" />
          <stop offset=".23" stopColor="#1d1f1e" />
          <stop offset=".52" stopColor="#101211" />
          <stop offset="1" stopColor="#080a09" />
        </linearGradient>
        <linearGradient
          id="rail-light"
          x1="845"
          y1="85"
          x2="592"
          y2="585"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#252725" />
          <stop offset=".5" stopColor="#121411" />
          <stop offset="1" stopColor="#090b09" />
        </linearGradient>
        <linearGradient
          id="yellow-line"
          x1="931"
          y1="90"
          x2="617"
          y2="684"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9b7905" />
          <stop offset=".48" stopColor="#ffe40e" />
          <stop offset=".78" stopColor="#b38b04" />
          <stop offset="1" stopColor="#46380b" stopOpacity=".18" />
        </linearGradient>
        <linearGradient
          id="right-yellow"
          x1="1600"
          y1="249"
          x2="1248"
          y2="900"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#e8c810" />
          <stop offset=".42" stopColor="#806308" />
          <stop offset=".65" stopColor="#ffe91f" />
          <stop offset="1" stopColor="#5b4509" />
        </linearGradient>
        <radialGradient id="panel-shine" cx=".39" cy=".02" r=".9">
          <stop stopColor="#777c79" stopOpacity=".08" />
          <stop offset="1" stopColor="#070908" stopOpacity="0" />
        </radialGradient>
        <pattern
          id="perforation"
          width="9"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <rect width="9" height="10" fill="#0d0f0d" />
          <ellipse cx="2" cy="2.4" rx="1.8" ry="2.1" fill="#020403" />
          <ellipse cx="6.5" cy="7.5" rx="1.8" ry="2.1" fill="#020403" />
        </pattern>
        <pattern
          id="brushed-lines"
          width="6"
          height="6"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(29)"
        >
          <path d="M0 0v6" stroke="#ffffff" strokeOpacity=".007" />
        </pattern>
        <filter id="surface-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency=".72"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <clipPath id="main-panel-clip">
          <path d="M935 84H1660L1325 680H614Z" />
        </clipPath>
      </defs>
      <path fill="url(#base-light)" d="M0 0h1600v900H0z" />
      <path fill="#070908" d="M756 84h116L550 680H436Z" />
      <path
        stroke="#343632"
        strokeOpacity=".55"
        d="M756 84 437 680M842 84 520 680"
      />
      <path fill="url(#rail-light)" d="M847 84h69L595 680h-70Z" />
      <path
        stroke="#42443f"
        strokeOpacity=".55"
        d="M849 84 527 680M900 84 579 680"
      />
      <path fill="#030504" d="M910 84h12L600 680h-12Z" />
      <path fill="#282923" d="M922 84h13L614 680h-14Z" />
      <path fill="url(#panel-light)" d="M935 84H1660L1325 680H614Z" />
      <path fill="url(#panel-shine)" d="M935 84H1660L1325 680H614Z" />
      <path fill="url(#brushed-lines)" d="M847 84h813L1325 680H525Z" />
      <g clipPath="url(#main-panel-clip)">
        <path
          stroke="#000"
          strokeOpacity=".23"
          d="m891 420-140 260m104-189-99 189m688-242-137 242"
        />
        <path
          stroke="#797b74"
          strokeOpacity=".045"
          d="m892 420-140 260m104-189-99 189m688-242-137 242"
        />
      </g>
      <path
        stroke="url(#yellow-line)"
        strokeWidth="2.5"
        d="M935 84 614 680"
      />
      <path
        fill="#070908"
        d="m1600 177-275 503-123 220h70l124-220 204-375Z"
      />
      <path stroke="#030503" strokeWidth="2" d="m1600 177-275 503-123 220" />
      <path
        stroke="#32362f"
        strokeOpacity=".6"
        d="m1600 252-232 428-121 220"
      />
      <path fill="url(#perforation)" d="M1600 255v645h-350Z" />
      <path
        stroke="url(#right-yellow)"
        strokeWidth="3"
        d="m1600 253-233 427-120 220"
      />
      <path
        fill="#181a16"
        fillOpacity=".65"
        d="m1396 680-124 220h-24l120-220Z"
      />
      <path
        fill="#83867e"
        opacity=".028"
        filter="url(#surface-grain)"
        d="M0 0h1600v900H0z"
      />
    </svg>
  )
}
