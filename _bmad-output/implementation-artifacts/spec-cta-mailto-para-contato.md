---
title: 'Replace mailto CTAs with links to /contato'
type: 'feature'
created: '2026-09-25'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 8 CTAs across the public site (`HEADER_CTA`, `HERO_PRIMARY_CTA`, `PROBLEMS_BRIDGE_CTA`, and the 4 `SERVICES` entries in `src/data/home-content.ts`) still open a `mailto:` link. Every message sent this way bypasses the lead-capture pipeline (`/contato` → `ContactForm` → `POST /api/leads` → `leads` table in Supabase) that already exists and already works — those leads never become rows an admin can see in `/painel-8f2k/leads`.

**Approach:** Change those 8 `href` values from `mailto:${CONTACT_EMAIL}?subject=...` to `"/contato"`. Every one of these CTAs already renders through the shared `ArrowLink` component (`src/components/shared/arrow-link.tsx`), which already branches on `isInternalHref()` to render `next/link` for internal paths and a plain `<a>` for everything else — so no component changes are needed, only the data.

</frozen-after-approval>

## Implementation Notes

- `src/data/home-content.ts` — replaced all 8 `mailto:${CONTACT_EMAIL}?subject=...` hrefs (`HEADER_CTA`, `HERO_PRIMARY_CTA`, `PROBLEMS_BRIDGE_CTA`, and the 4 `SERVICES` entries) with `"/contato"`. `CONTACT_EMAIL` stays exported/used (footer's direct mailto link, `src/components/site-footer.tsx`, is out of scope — it's a plain contact address, not a lead-capture CTA).
- No `ArrowLink` or render-site changes needed: every one of these CTAs already renders through `src/components/shared/arrow-link.tsx`, which already branches on `isInternalHref()`.
- Found and fixed one collateral bug while implementing: `src/app/(marketing)/servicos/page.tsx` used `key={service.href}` in the `SERVICES.map()` — all 4 hrefs are now identically `"/contato"`, which would have made the React keys collide. Changed the key to `service.title` (already unique).
- No subagent review layers run this turn (standing user instruction to avoid subagents until token reset). Self-reviewed the diff inline instead: `tsc --noEmit`, `eslint`, and `vitest run` all clean (477 tests); confirmed via DOM read in Chromium that the `/servicos` CTA links resolve to `href="/contato"`.
