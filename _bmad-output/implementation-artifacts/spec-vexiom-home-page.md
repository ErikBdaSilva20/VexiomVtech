---
title: 'Port home-reference.html into the Next.js home page, pixel-identical'
type: 'feature'
created: '2026-09-22'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'NO_VCS'
context: ['{project-root}/home-reference.html']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates; superseded by the human's 2026-09-22 renegotiation below">

## Intent

**Problem:** `src/app/page.tsx` is still the `create-next-app` placeholder. `home-reference.html` at the repo root is a complete, pixel-precise static build of the approved Vexiom home page (Header, Hero, Services) but is not wired into the Next.js app.

**Approach:** Port `home-reference.html` into componentized React (Header, HeroSection [+ subparts], ServicesSection [+ ServiceCard]) with Tailwind v4, reproducing its markup, copy, structure, CSS values and breakpoints **exactly** — it is the sole visual and content source of truth for this page, overriding `prompt.md` and the mockup PNG wherever they differ from it.

**Renegotiation (2026-09-22):** The human explicitly overrode the prior version of this spec, which had wrongly treated `home-reference.html` as stale and used `prompt.md`/the mockup PNG for copy instead: *"a interface precisa obrigatoriamente ser 100% idêntica a esse arquivo aqui... não pode ser NADA diferente."* `home-reference.html` now replaces the mockup PNG and `prompt.md` as the authoritative source for every piece of copy, color, spacing value, and structural decision in Header/Hero/Services. `prompt.md`'s componentization guidance (small components, data arrays, no invented imagery) still applies as a code-quality convention, never to justify a content/visual deviation from the reference file.

**Scope correction:** `home-reference.html` contains only Header, Hero and Services — no "NOSSAS SOLUÇÕES" divider, no ProjectsSection. Building either now would itself be "different" from the reference, so both are dropped from this spec (logged in `deferred-work.md`). A prior implementation pass already scaffolded `hero/`, `services/`, `shared/`, `site-header.tsx`, `primary-nav.tsx`, `data/home-content.ts` against the old (wrong) copy/tokens, plus a `projects/` section and `solutions-divider.tsx` now out of scope — the projects/divider files have already been deleted; the remaining files must be rewritten to match `home-reference.html` exactly, not merely adjusted.

## Boundaries & Constraints

**Always:**
- Every visible string (nav items, eyebrow, headline lines, description, CTA labels, stat numbers/labels, service card numbers/titles/descriptions, `aria-label`s) must match `home-reference.html` verbatim, including which nav items are real links (`Início`, `Serviços`, `Contato`) vs. inert `<span>`s (`Cases`, `Como trabalhamos`).
- Every `href` must match exactly, including per-CTA `mailto:` subjects (header CTA `?subject=Vamos%20conversar`, hero primary `?subject=Agendar%20uma%20conversa`, hero secondary `href="#servicos"` — NOT mailto —, nav `Contato` mailto with no subject, each service card's own `?subject=...`).
- Colors/fonts must match the reference's literal `:root` values exactly: `--yellow:#ffe10b`, `--white:#ededf1`, `--muted:#ccccce`, `--background:#0b0c0b`, font family Montserrat (copied to `src/app/fonts/Montserrat-VariableFont_wght.ttf`, load via `next/font/local`, weight range 100–900). Correct the existing `--vexiom-*` tokens in `globals.css` to these exact hex values (single source of truth) rather than adding a second palette.
- The brand mark must use `public/assets/vexiom-emblem-reference.png` (already copied, 1672×941) with the reference's exact technique: an SVG `<symbol id="brand-mark" viewBox="930 280 500 315">` containing an `<image>` at `width="1672" height="941"` with the same `feColorMatrix` alpha filter (`values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  1 1 1 0 -0.43"`), reused via `<use>` at small size in the header and large size in the hero.
- Reproduce the reference's `--unit: 0.0625vw` proportional scaling for desktop, the `1921px` max-width-1920px-centered rule, and the `1100px`/`650px`/`360px` breakpoints with the same behavior at each (nav collapses to a `mobile-menu`, stats/hero/services restack per the reference's own media queries).
- Mobile menu interaction must match the reference's script exactly: opens/closes on trigger click, closes on link click (focus returns to trigger), closes on `Escape` (focus returns to trigger), closes on outside click, closes on resize to ≥1101px.
- Split into small components (Header/nav, HeroSection[HeroContent/HeroVisual/HeroActions], ServicesSection[ServiceCard]) driven by small typed data arrays (nav items, services) — reuse/fix the existing `src/data/home-content.ts` rather than hardcoding copy per component.

**Never:**
- No copy, colors, nav items, CTA text/hrefs, or stat numbers from `prompt.md` or the mockup PNG where they differ from `home-reference.html` — that was the previous (now-corrected) mistake.
- No "NOSSAS SOLUÇÕES" divider, no ProjectsSection (deferred — see `deferred-work.md`).
- No new npm dependencies.

</frozen-after-approval>

## Code Map

- `home-reference.html` -- full source of truth; read in full before touching any component (header 1217-1274, hero 1276-1347, services 1349-1445, CSS 12-987, mobile-menu script 1448-1472).
- `public/assets/vexiom-emblem-reference.png` -- already copied from `/home/erik/Documentos/Projetos/V_TECH/assets/`, confirmed 1672×941 matching the reference's filter math exactly.
- `src/app/fonts/Montserrat-VariableFont_wght.ttf` -- already copied; wire via `next/font/local` in `src/app/layout.tsx`, replacing the current Geist Sans/Mono loading.
- `src/app/globals.css` -- has `--vexiom-yellow`/`--vexiom-graphite*`/`--vexiom-gray*` tokens at the wrong hex values for this reference; correct them in place to `#ffe10b`/`#0b0c0b`/`#ededf1`/`#ccccce` (and any other graphite/gray shades the reference's CSS uses) rather than adding new variables.
- `src/data/home-content.ts` -- exists from the prior pass with wrong copy; rewrite its arrays (`NAV_ITEMS`, `SERVICES`, stats) to the reference's exact text/hrefs.
- `src/components/site-header.tsx`, `src/components/primary-nav.tsx` -- exist, built against wrong copy/structure; rewrite to match reference header markup/behavior exactly (desktop nav, mobile `details`-based menu, centered brand mark, CTA).
- `src/components/hero/{hero-section,hero-content,hero-visual,hero-actions}.tsx` -- exist, wrong copy; rewrite per reference hero markup (eyebrow, headline with light/accent spans, description, dual CTA, stats `dl`, large brand mark, two decorative `hero-note` texts).
- `src/components/services/{services-section,service-card}.tsx` -- exist, wrong copy/count/order; rewrite to the reference's 4 cards (Sites e Landing Pages / Sistemas Sob Medida [featured] / Lojas Online / Automações com IA), intro (`DO PROBLEMA À SOLUÇÃO` / "Soluções com propósito.") and the `services-note` decorative text ("INOVAÇÃO QUE GERA MOVIMENTO").
- `src/components/shared/{arrow-link,cta-button,decorative-note,eyebrow,section-intro}.tsx` -- exist from the prior pass; keep and adapt if their shape already fits the reference's repeated patterns (arrow icon buttons/links, eyebrow labels, decorative vertical note blocks), otherwise adjust — do not introduce parallel one-off markup where these already cover the pattern.
- `src/app/page.tsx` -- compose `<SiteHeader/><HeroSection/><ServicesSection/>` only.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/globals.css` -- correct `--vexiom-*` token hex values to the reference's exact colors -- single-source palette fix
- [x] `src/app/layout.tsx` -- load Montserrat via `next/font/local`, remove Geist -- font fidelity
- [x] `src/data/home-content.ts` -- rewrite nav/services/stat data to reference's exact copy and hrefs
- [x] `src/components/site-header.tsx` + `primary-nav.tsx` -- rewrite to match reference header exactly, including mobile menu a11y behavior
- [x] `src/components/hero/*.tsx` -- rewrite to match reference hero exactly (copy, brand-mark composition, stats, decorative notes)
- [x] `src/components/services/*.tsx` -- rewrite to match reference services section exactly (4 cards, intro, note)
- [x] `src/app/page.tsx` -- compose Header+Hero+Services (plus the unavoidable page shell: icon sprite defs, background-art SVG, skip-link — see Implementation Notes)
- [x] responsive breakpoints at 1921px/1100px/650px/360px matching the reference's own media queries

**Acceptance Criteria:**
- Given any viewport width, when `/` is compared against `home-reference.html` opened directly in a browser at the same width, then layout, copy, colors, and spacing read as visually identical.
- Given a mobile viewport (<1100px), when the nav trigger is used, then open/close/Escape/outside-click/resize-to-desktop behavior matches the reference script.
- Given `pnpm lint` and `pnpm build`, when run, then both succeed with no new errors.

## Implementation Notes

- The port is mechanical: `home-reference.html`'s CSS (custom properties, `--unit` proportional scaling, every class selector and its three media queries) was transcribed 1:1 into `src/app/globals.css`, keeping the reference's literal class names (`.site-header`, `.hero-copy`, `.service-card`, etc.) so components render with zero Tailwind-utility translation for anything scale-sensitive. The reference's own `--yellow`/`--white`/`--muted`/`--background` custom properties were re-pointed to the corrected `--vexiom-yellow`/`--vexiom-gray-light`/`--vexiom-gray-medium`/`--background` tokens instead of being re-declared, per the "single source of truth, no second palette" constraint.
- `src/app/page.tsx` composes `<SiteHeader/><HeroSection/><ServicesSection/>` as specified, plus the page shell markup that structurally has to wrap them (the sprite `<defs>` reused via `<use>`, the `.page` wrapper, skip-link, and `<BackgroundArt/>`) since none of it belongs to Header/Hero/Services individually and the reference's `.page` element (position/isolation/overflow-clip) is required for the background art's z-index stacking to render correctly. Two new shared, content-free infrastructure components were added for this: `src/components/shared/icon-sprite.tsx` and `src/components/shared/background-art.tsx`.
- **Asset correction (found during verification, not anticipated by the spec):** the previously-copied `public/assets/vexiom-emblem-reference.png` does NOT match what `home-reference.html` actually references (`assets/vexiom-wordmark-reference.png`) — despite both being 1672×941 PNGs, they are different images. Cropping the reference's exact symbol viewBox (`860 362 680 110`) from `vexiom-emblem-reference.png` only captured a bare "V" chevron with the "Vexiom" wordmark cut off; the same crop from `vexiom-wordmark-reference.png` (found in `src/assets/`, not previously copied to `public/`) produces the correct, fully-framed "Vexiom" wordmark-with-wings lockup. Fixed by copying `src/assets/vexiom-wordmark-reference.png` to `public/assets/vexiom-wordmark-reference.png`, pointing `icon-sprite.tsx`'s `<image href>` at it, and deleting the wrong `public/assets/vexiom-emblem-reference.png`. Verified visually in the browser (header + hero brand mark) before/after.
- The 5 old shared components from the prior (wrong-token) implementation pass — `arrow-link.tsx`, `cta-button.tsx`, `decorative-note.tsx`, `eyebrow.tsx`, `section-intro.tsx` — were deleted rather than adapted: they were Tailwind-utility/clip-path abstractions built for the old wrong visual language, and the mechanical CSS-class port makes them structurally unnecessary (e.g. the hero eyebrow's leading bar and the services-eyebrow's underline are both plain CSS `::before`/`::after` on the literal reference classes, no component needed).
- Mobile menu a11y logic (`site-header.tsx`) is a direct port of the reference's vanilla `<script>`: an uncontrolled native `<details>` (not React state) so the browser's default summary-click toggle is untouched, with a `useEffect` wiring the same four listeners (link-click closes + refocuses trigger, `Escape` closes + refocuses, outside click closes, `matchMedia("(min-width: 1101px)")` change closes). Verified programmatically via dispatched events in the running app; parity-checked against identical synthetic-event tests run on `home-reference.html` itself (both show the same "focus after same-page hash navigation" quirk, confirming it's inherent to the reference's own script, not a port regression).

- **Independent verification (coordinator, post-implementation, not the implementing subagent):** re-ran `pnpm lint`/`pnpm build` clean; found and removed a leftover `src/assets/` dump (8 unused reference images the implementing subagent had copied in for its own crop investigation, never imported by any code) as dead-code cleanup. Served `home-reference.html` over a local static server and the app via `pnpm dev`, screenshot-compared both at 1920px: found a real fidelity bug the subagent's own comparison had missed — `.hero-description` and `.stats` rendered with `margin-top: 0` instead of the reference's `~30px`/`~54px`, visibly shifting the entire lower hero block down. Root cause: the port had scoped the reference's low-specificity reset `h1, h2, h3, p, dl, dd { margin: 0; }` as `.page h1, .page h2, ..., .page dd { margin: 0; }` to avoid leaking into the rest of the app — a reasonable intent, but it raised the selector's specificity above `.hero-description`/`.stats` (both single-class selectors), so the reset started winning instead of losing. Fixed in `src/app/globals.css` by rewriting it as `.page :where(h1, h2, h3, p, dl, dd) { margin: 0; }` — `:where()` keeps the `.page` scoping (zero added specificity) so the cascade order matches the reference exactly. Re-verified: computed `margin-top`/element positions now match the reference tab to the pixel across the full hero+services fold. Also ran a whitespace/`.page`/token-rename-normalized rule-level diff of the entire base CSS and all 5 media-query blocks against `home-reference.html` — no other discrepancies found. Could not verify true viewport-resize behavior at 1100/650/360px (this sandbox's browser resize tool doesn't actually shrink the rendered viewport, confirmed via `window.innerWidth`), so that risk flagged by the implementing subagent still stands — recommend a manual check outside the sandbox.

## Spec Change Log

- 2026-09-22: Human renegotiated the frozen Intent — `home-reference.html` replaces `prompt.md`/mockup PNG as the sole source of truth for Header/Hero/Services copy and visuals. ProjectsSection and the "NOSSAS SOLUÇÕES" divider dropped from scope (were never in the reference file) and logged in `deferred-work.md`. Prior implementation pass's `projects/` components and `solutions-divider.tsx` deleted as dead code; `hero/`, `services/`, `shared/`, `site-header.tsx`, `primary-nav.tsx`, `data/home-content.ts` kept as a structural scaffold but must be rewritten for content/token accuracy. Wrong asset copies (`public/vexiom-logo.png`, `src/assets/*`) removed; correct `public/assets/vexiom-emblem-reference.png` and `src/app/fonts/Montserrat-VariableFont_wght.ttf` copied in from `V_TECH/assets` (read-only source, dimensions/format verified).

## Review Triage Log

- **false** — Blind Hunter: `layout.tsx`'s `LayoutProps<"/">` may not compile without confirmed `typedRoutes`. Refuted: this line is unchanged from the original `create-next-app` scaffold (predates this diff), and `pnpm build` (full TS typecheck) already succeeded against it.
- **false** — Blind Hunter: `tw-animate-css`/`shadcn/tailwind.css` imports unverifiable as installed deps. Refuted: both `@import` lines are unchanged from the original scaffold, both packages are already in `package.json`, and `pnpm build`/`pnpm lint` succeeded.
- **false** — Blind Hunter: no favicon. Refuted: `src/app/favicon.ico` exists; Next.js wires it automatically via its file-based metadata convention.
- **false** — Blind Hunter: local Montserrat `.ttf` has no `preload`, hurting LCP. Refuted: `next/font/local` defaults `preload: true` and it isn't overridden in `layout.tsx`, so Next.js auto-injects the preload link; `.ttf` format itself is an explicit frozen-intent requirement (matches the reference's own `@font-face`).
- **low, rejected** — Blind Hunter: no OG/Twitter/`metadataBase` social-share metadata. Real but absent from `home-reference.html` itself (the frozen source of truth for this page) and unlikely to be hit in the page's actual use today; the fix (images, URL decisions) is more than a direct correction, so rejected per the low-finding rule.
- **low, rejected** — Blind Hunter: no test file covers the hand-ported mobile-menu logic. Real, but the project has zero test infrastructure at all (no framework in `package.json`, confirmed by the verification-gap layer) — introducing one is more than a direct correction and out of this single-page story's scope; behavior was independently traced line-for-line against the reference by two reviewers plus a manual live-browser check.
- **low, patch** — Blind Hunter: `--font-mono` maps to Montserrat (not a real monospace face). Real token inaccuracy though currently unused anywhere on the page; trivial one-line fix, so not rejected.
- **low, patch** — Blind Hunter: `icon-sprite.tsx`'s inner `<image>` lacks its own `aria-hidden`, a possible extra unlabeled node for some AT/browser combos despite the wrapping `role="img" aria-label="Vexiom"`. Trivial, zero-visual-impact fix.
- **low, patch** — Blind Hunter: deleting the 5 old shared components (`arrow-link`, `cta-button`, `decorative-note`, `eyebrow`, `section-intro`) without a replacement re-inlined the repeated "link + trailing arrow icon" shape at 6 call sites (header CTA, hero primary button, 4 service cards) — the spec's own Code Map had asked to preserve this reuse ("do not introduce parallel one-off markup where these already cover the pattern"). Real, developer-facing (next feature work on this page will re-duplicate it), not rejected.
- **low, patch** — Edge Case Hunter (3 findings, one root cause): `primary-nav.tsx`, `hero-content.tsx`, `services-section.tsx` key their `.map()` renders off plain display strings (`label`/`title`) with no enforced uniqueness. Not an active bug (today's data arrays happen to be unique) but a real latent React-key collision the moment a duplicate label/title is added; trivial fix (key by `href` or a value+label composite).
- **clean** — Verification-gap layer: no findings; traced CSS/markup/behavior against the reference and found no falsified spec claims.

All 4 `patch` entries above were sent back to the implementing subagent and fixed: `--font-mono` repointed to a real monospace stack, `aria-hidden` added to the sprite's inner `<image>`, all three `.map()` keys switched to guaranteed-unique values, and a new `src/components/shared/arrow-link.tsx` extracted and wired into all 6 icon-fronted-link call sites. Re-verified independently after the patch: `pnpm lint`/`pnpm build` clean, and a live-browser screenshot at 1920px still matches `home-reference.html` pixel-for-pixel (no visual regression from the `ArrowLink` extraction).



## Design Notes

The reference's `--unit: 0.0625vw` system scales every dimension proportionally to viewport width up to the `1921px` breakpoint (where it switches to a fixed `1.2px` unit centered at 1920px). Reproduce this with the same CSS custom property (global, not per-component) rather than converting every `calc(N * var(--unit))` into a Tailwind arbitrary value — keeps the port mechanical and verifiably exact against the source file. Tailwind utilities are fine for anything that isn't scale-sensitive (flex/grid structure, one-off colors already matching tokens).

## Verification

**Commands:**
- `pnpm lint` -- expected: no errors
- `pnpm build` -- expected: succeeds (typecheck + production build)

**Manual checks:**
- `pnpm dev`, open `home-reference.html` directly in one browser tab and `http://localhost:3000` in another, compare side by side at 1920px, 1366px, 1100px, 650px and 360px widths.
