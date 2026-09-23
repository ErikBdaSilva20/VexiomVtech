---
title: 'Migrate Hero styling from globals.css to Tailwind utility classes'
type: 'refactor'
created: '2026-09-23'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
baseline_commit: 'cb8008af499261194dc7b38bfea93267ec14b589'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `src/app/globals.css` is a 1845-line monolith. All Hero visual rules live there as named classes (`.hero-copy`, `.button`, `.solution-shortcut`, etc.), so a one-property change — e.g. resizing the hero button — requires searching a huge unrelated file instead of editing the component that owns the markup. Tailwind is already installed but unused for this styling.

**Approach:** Move every Hero-scoped CSS rule into Tailwind utility classes written directly on the JSX elements that use them (arbitrary values/properties where Tailwind has no named utility, e.g. `w-[calc(211*var(--unit))]`, `before:content-['']`). Preserve the existing proportional-scale system (`--unit` custom property) and the two Hero-relevant custom breakpoints (1100px, 650px) exactly as they behave today — this is a styling-location refactor, not a visual or breakpoint redesign. Remove the migrated rules from `globals.css` once their component compiles and renders identically. Header migration is deferred (`deferred-work.md`) to keep this spec independently shippable.

## Boundaries & Constraints

**Always:**
- Preserve pixel-identical Hero output at every breakpoint (unscaled desktop canvas, 1100px, 650px) — this page was previously ported pixel-exact from `home-reference.html` and that invariant still applies.
- Keep using the existing `--unit`, `--vexiom-*` custom properties already defined in `:root` in `globals.css` — reference them via Tailwind arbitrary values (`calc(N*var(--unit))`), do not hardcode px/rem equivalents.
- Use Tailwind v4 arbitrary variants (`before:`, `after:`, `hover:`, `[@media(max-width:1100px)]:`, `[@media(max-width:650px)]:`) to reproduce pseudo-elements, hover states and the two custom max-width breakpoints.
- Scope this pass to: `src/components/hero/hero-section.tsx`, `src/components/hero/hero-content.tsx`, `src/components/hero/hero-actions.tsx`, `src/components/hero/hero-visual.tsx`, `src/components/hero/solution-shortcuts.tsx`, and `src/components/shared/arrow-link.tsx` (call-site-only change: pass explicit Tailwind `arrowClassName` for the hero primary button's arrow instead of relying on `.button .icon`).
- Leave `src/components/site-header.tsx` and `src/components/primary-nav.tsx` untouched — Header migration is a separate follow-up spec.
- Leave `.page`, `.icon` (base rule), `.background-art`, `.skip-link`, and every non-Hero rule (Header, Services, Resolutions, Problems, page-hero, forms, blog cards, `:root`/`.dark`/`@theme inline` tokens, `prefers-reduced-motion`) untouched in `globals.css`.

**Never:**
- Do not touch Header, Services, Resolutions, or Problems sections' CSS or components in this pass.
- Do not switch to Tailwind's default spacing/breakpoint scale in place of the `--unit` proportional system — that would change the rendered layout.
- Do not introduce a CSS Modules or `@apply` layer as a workaround; utility classes go directly on JSX per the approach above.

## Code Map

- `src/app/globals.css:422-652` -- Hero base rules to migrate and delete: `.hero`, `.hero-copy`, `.eyebrow`(+`::before`), `.hero h1`(+`span`/`.light-text`/`.light-text:first-child`/`.light-text:nth-child(2)`/`.accent`), `.hero-description`, `.hero-actions`, `.button`(+`::before`/`::after`), `.button-primary`(+`::before`, hover), `.button-secondary`(+`::before`/`::after`, hover), `.button .icon`, `.solution-shortcuts`, `.solution-shortcuts-label`, `.solution-shortcut`(+ adjacent-sibling `::before`), `.solution-index`, `.solution-copy`(+`strong`/`small`), `.solution-arrow`, `.solution-shortcut:hover .solution-copy strong`, `.hero-brand`, `.hero-note`(+`-top`/`-bottom`).
- `src/app/globals.css:1487-1528` -- inside `@media (max-width:1100px)`: `.hero`, `.hero-copy`, `.eyebrow`, `.hero h1`, `.hero-description`, `.hero-actions`, `.hero-brand`, `.hero-note-top`, `.hero-note-bottom` — migrate these, leave the rest of the block (Header/Services/Problems overrides) in place.
- `src/app/globals.css:1639-1740` -- inside `@media (max-width:650px)`: `.hero`, `.hero-copy`, `.eyebrow`(+`::before`), `.hero h1`(+`.accent`), `.hero-description`(+`br`), `.hero-actions`, `.button`(+`-primary`/`-secondary`/`.icon`), `.solution-shortcuts`, `.solution-shortcut`(+ adjacent-sibling `::before`), `.hero-brand`, `.hero-note-top`, `.hero-note-bottom` — migrate these, leave the rest of the block in place.
- `src/app/globals.css:60-149,162-164` -- `:root`/`.dark`/`@theme inline` tokens and `--unit` stay; Hero utilities reference `var(--unit)`/`var(--vexiom-*)` via arbitrary values.
- `src/components/hero/hero-section.tsx` -- owns `.hero` (the `<section>`, currently `className="hero"`).
- `src/components/hero/hero-content.tsx` -- owns `.hero-copy`, `.eyebrow`, `.light-text`/`.accent` spans, `.hero-description`.
- `src/components/hero/hero-actions.tsx` -- owns `.hero-actions`, `.button`/`.button-primary`/`.button-secondary` — the button the human specifically wants easy to resize; `ArrowLink` here needs an explicit `arrowClassName` replacing today's `.button .icon` descendant rule.
- `src/components/hero/hero-visual.tsx` -- owns `.hero-brand`, `.hero-note`/`.hero-note-top`/`.hero-note-bottom`.
- `src/components/hero/solution-shortcuts.tsx` -- owns `.solution-shortcuts`, `.solution-shortcuts-label`, `.solution-shortcut`, `.solution-index`, `.solution-copy`, `.solution-arrow`.
- `src/components/shared/arrow-link.tsx` -- no structural change needed; `arrowClassName` prop already supports a full override string, used as-is from `hero-actions.tsx`.

## Tasks & Acceptance

**Execution:**
- [x] `src/components/hero/hero-actions.tsx` -- convert `.hero-actions`/`.button`/`.button-primary`/`.button-secondary` (+ hover, `::before`/`::after` clip-paths, 650px overrides) to Tailwind classes on the wrapper `div`, `ArrowLink`, and `a`; pass explicit `arrowClassName` to `ArrowLink` -- this is the button the human wants to resize without touching global CSS
- [x] `src/components/hero/hero-content.tsx` -- convert `.hero-copy`/`.eyebrow`(+`::before`)/`.hero h1`/`.light-text`/`.accent`/`.hero-description` incl. 1100px/650px overrides
- [x] `src/components/hero/hero-visual.tsx` -- convert `.hero-brand`/`.hero-note`/`.hero-note-top`/`.hero-note-bottom` incl. 1100px/650px overrides
- [x] `src/components/hero/hero-section.tsx` -- convert `.hero` incl. 1100px/650px height/padding overrides
- [x] `src/components/hero/solution-shortcuts.tsx` -- convert `.solution-shortcuts`/`.solution-shortcuts-label`/`.solution-shortcut`/`.solution-index`/`.solution-copy`/`.solution-arrow` incl. hover and 650px grid-area reflow
- [x] `src/app/globals.css` -- delete every migrated rule identified in Code Map once its component is converted and verified; leave Header/Services/Resolutions/Problems/shared rules untouched

**Acceptance Criteria:**
- Given the dev server running, when the home page loads at desktop width, then the Hero section renders pixel-identical to the current (pre-migration) screenshot.
- Given the dev server running, when the viewport is resized through 1100px and 650px, then Hero layout (copy stacking, button widths, solution-shortcuts reflow, hero-brand/hero-note repositioning) matches the current responsive behavior at each breakpoint.
- Given `globals.css` after the migration, when searched for the Hero class names listed in Code Map, then none remain (fully removed, not just unused).

## Implementation Notes

- Found and migrated a Hero override the Code Map missed: an `@media (max-width: 360px)` block (`.hero`, `.hero h1`, `.eyebrow`, `.button`) that wasn't listed in the Code Map's line ranges. Migrated it into the same components under a `[@media(max-width:360px)]:` variant to satisfy the "pixel-identical at every breakpoint" and "none remain" acceptance criteria, since leaving it would have broken sub-360px rendering and left Hero class names in `globals.css`.
- `ArrowLink`'s `arrowClassName` for the hero primary CTA deliberately does not reuse the `icon` class name: `.page .icon` (untouched, two-class selector) has higher specificity than any single Tailwind utility class, so keeping `className="icon ..."` would have let the old 24×24 base win over the new Tailwind width/height. Instead `arrowClassName` fully replicates the base `.page .icon` properties (fill-none, stroke-current, stroke-linecap/linejoin round, flex-none) plus the old `.button .icon` sizing, with no `icon` class at all — avoids the specificity collision entirely.
- Dropped the primary button's dead `.button::after` pseudo-element (inherited from the shared `.button::before/::after` base rule but never given a background by `.button-primary`, so it rendered nothing) rather than reproducing an invisible no-op layer.
- `solution-shortcut`'s adjacent-sibling styling (`.solution-shortcut + .solution-shortcut`) was reproduced via `index > 0` conditional classes in the `.map()` instead of a CSS sibling selector, since React already knows the index.

## Verification

**Commands:**
- `npm run build` -- expected: no type or build errors
- `npm run lint` -- expected: no new lint errors

**Manual checks (if no CLI):**
- Run `npm run dev`, open the home page, visually compare the Hero section against a screenshot taken before starting the migration, at desktop width and at 1100px and 650px window widths.
</frozen-after-approval>
