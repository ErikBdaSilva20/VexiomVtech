---
title: 'Executive dashboard/overview for the admin area'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'fa687a010021c8fe9f96402c5e136617f625ae18'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The admin area used to be a single "central operacional" but was split into per-section pages (leads, cases, projects, financeiro, contracts) behind a nav select. That reorganization improved clarity but removed the one screen that showed consolidated, at-a-glance business health with charts — there is no dashboard today (`/painel-8f2k` just redirects to `/painel-8f2k/leads`).

**Approach:** Add a dashboard page that surfaces KPI cards and charts, built entirely from existing, already-reviewed read functions (`getFinancialBalance`, `getFinancialCharts`, `getProspectingOverview`, `listContracts`) — no new business logic, no new tables. It becomes the new default landing page at `/painel-8f2k` (replacing the current unconditional redirect to `/leads`), matching the "central operacional" role it used to have. Extract the existing inline KPI-card markup into a shared `StatCard` component and add `recharts` as the charting library (none exists in the repo yet). The user has given full visual freedom on this page and the shared components it introduces — optimize hard for at-a-glance legibility ("o mais moído possível") while keeping the existing dark-theme palette; this is not a license to rewrite other existing admin pages in this pass.

## Boundaries & Constraints

**Always:** `super_admin`-and-`employer`-safe by construction — every underlying read function already enforces its own role/RLS rules (e.g. `getProspectingOverview`/`listLeads` are readable by both roles, `getFinancialBalance`/`getFinancialCharts`/`listContracts` are super_admin-only per their existing contracts) — the dashboard page must call each function exactly as its existing callers do (same `admin`/role args), never widen access. Follow the established `getCurrentAdmin()` + `redirect()` guard pattern at the top of the page. Reuse the existing dark-theme card style (`rounded-xl border border-[#292b28] bg-[#181916]`) for visual consistency — no new color palette.

**Never:** No new database tables, columns, or migrations. No new business/aggregation logic duplicating what `getFinancialCharts`/`getProspectingOverview` already compute — if a needed number isn't already exposed, don't invent a new query, drop that chart from v1 and note it in Implementation Notes. Do not touch the `financeiro`/`contratos`/`leads` pages' own markup as part of this story — visual freedom applies to the new dashboard page and its new shared components only, not a rewrite of the rest of the admin. No date-range picker/interactivity beyond what the existing data functions already accept as default — this is a read-only landing view, not a new configurable reporting tool.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| `employer` role visits dashboard | Non-super_admin admin | Sees leads/prospecting KPIs and charts only; financeiro/contracts sections are omitted entirely (not shown as empty/locked) | N/A |
| `super_admin` visits dashboard | super_admin | Sees full set: prospecting + financeiro + contracts KPIs/charts | N/A |
| Underlying data source throws | e.g. Supabase query fails for one section | That section shows an inline error state; the rest of the dashboard still renders | Caught per-section, logged via `console.error`, does not crash the page |
| No data yet | Fresh project, zero leads/contracts/transactions | Each section renders its existing empty-state convention (zero values, "Nenhum X registrado") rather than crashing on empty arrays | N/A |

</frozen-after-approval>

## Code Map

- `src/components/admin/admin-nav.tsx` -- `Section` union + `LINKS` array: add the new dashboard section (e.g. `"overview"`, label "Visão geral", `href: "/painel-8f2k"`, `superAdminOnly: false` since prospecting data is visible to both roles) as the first entry
- `src/lib/finance/get-financial-balance.ts` -- `getFinancialBalance(supabase, query): Promise<FinancialBalance>` (`{ from, to, income, expense, balance }`, integer cents) — super_admin-only caller convention, reuse as-is
- `src/lib/finance/get-financial-charts.ts` -- `getFinancialCharts(supabase, admin, query): Promise<FinancialCharts>` (`{ from, to, incomeExpenseByMonth, expenseByCategory, contributionByPartner }`) — reuse as-is
- `src/lib/contracts/list-contracts.ts` -- `listContracts(supabase, admin, query): Promise<ListContractsResult>` — reuse as-is, only aggregate `.total` needed for a count KPI (call with small `page_size`)
- `src/lib/leads/get-prospecting-overview.ts` -- `getProspectingOverview(supabase, query): Promise<ProspectingOverview>` (`{ from, to, totalLeads, funnel, conversionRate, projectTypeDistribution, volumeByMonth }`) — reuse as-is, readable by both roles
- `src/app/painel-8f2k/financeiro/page.tsx:148-150` -- existing inline KPI-card Tailwind pattern for reference only; the new `StatCard` is free to look better, doesn't need to match it exactly
- New: `src/components/admin/stat-card.tsx` -- shared `StatCard` component (label + value + optional hint/trend), used by the new dashboard page (existing pages keep their inline markup — out of scope to refactor them)
- `src/app/painel-8f2k/page.tsx` (rewritten) -- server component, `getCurrentAdmin()` + `redirect("/painel-8f2k/login")` guard (no role redirect — both roles land here), calls the four read functions in parallel (`Promise.all`) with per-section try/catch per the I/O Matrix, renders KPI row + chart sections, omits the financeiro/contracts fetches and sections entirely server-side when `admin.role !== 'super_admin'`

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- add `recharts` -- needed to render `incomeExpenseByMonth`/`expenseByCategory`/`volumeByMonth`/`funnel` as actual charts, not tables
- [x] `src/components/admin/stat-card.tsx` -- new shared KPI card component (label, value, optional hint/trend) -- de-duplicates copy-pasted card markup and anchors the dashboard's visual language
- [x] `src/components/admin/admin-nav.tsx` -- add "Visão geral" `Section` + `LINKS` entry, first in the list, `href: "/painel-8f2k"` -- makes the dashboard reachable from the nav as the natural home
- [x] `src/app/painel-8f2k/page.tsx` -- rewrite: role guard, parallel fetch of the four data sources, renders KPI row + chart sections, per-section error isolation, role-based section omission -- the feature itself
- [x] `src/app/painel-8f2k/*-chart.tsx` (client components, `recharts` requires them for SSR-safety) -- render `incomeExpenseByMonth`, `expenseByCategory`, `volumeByMonth` (leads over time), and `funnel` (leads by status) -- richer v1 per the user's explicit ask for depth + charts, all backed by already-computed data, no new aggregation logic
- [x] Before writing chart code: consult the `dataviz` skill for form/color/legibility guidance so the result reads as one coherent system, not four mismatched widgets

**Acceptance Criteria:**
- Given an `employer` admin, when they visit the dashboard, then financeiro and contracts sections are absent from the rendered output (not present in the DOM), and no request is made to `getFinancialBalance`/`getFinancialCharts`/`listContracts`.
- Given a `super_admin` admin with existing leads, transactions, and contracts, when they visit the dashboard, then all four KPI/chart sections render with real data matching what their respective existing pages (`financeiro`, `contratos`, `leads`) show for the same period.
- Given one of the four underlying calls throws, when the dashboard renders, then only that section shows an error message and the other three sections still render correctly.

## Implementation Notes

- The four sections fetch in parallel: `getProspectingOverview` always (readable by both roles); `getFinancialBalance`/`getFinancialCharts`/`listContracts` only inside `if (isSuperAdmin)` — an `employer` admin's render never calls those three functions, satisfying the "no request made" acceptance criterion server-side (nothing to intercept client-side since this is a server component).
- Each of the four calls is wrapped in its own try/catch (`getProspectingOverview`) or `.catch()` (the three `Promise.all` entries), each setting an independent `*Error` flag and logging via `console.error` — one failing section renders `ErrorState` while the other sections still render from their own successful data.
- Empty-state handling follows each function's own zero-value shape (e.g. `funnel.contrato_fechado === 0`, `volumeByMonth.length === 0`) — no new "is this empty" logic invented; charts are swapped for a "Nenhum X registrado" message when their backing array is empty, matching the existing admin empty-state convention.
- `listContracts` is called with `{ page: 1, page_size: 1 }` — only `.total` is used for the KPI count, per the Code Map's guidance to avoid pulling a full page of contract rows just to count them.
- Chart colors reuse hues already present in the financeiro page's own Tailwind classes (emerald for income/`contrato_fechado`, red for expense/`nao_convertido`) plus the existing `#fbd020` accent for the leads volume/status series — no new palette introduced, consistent with the "no new color palette" constraint.
- `recharts` was added as a plain dependency via `pnpm add recharts` (the repo is pnpm-managed via `pnpm-lock.yaml`, not npm) — chart components are `"use client"` per Code Map's SSR-safety note.
- A colocated `src/components/admin/stat-card.test.ts` smoke test renders `StatCard` with `react-dom/server`'s `renderToStaticMarkup` rather than adding a new React Testing Library / jsdom setup — the existing `vitest.config.ts` runs in `environment: "node"` with no DOM testing library present anywhere in the repo, and introducing one for a single smoke test was judged out of scope for this story.
- Post-implementation live browser check (real test data: 1 lead, 1 zero-value transaction month, 1 contract) surfaced two real rendering bugs, fixed directly: (1) `LeadsFunnelChart`'s Y-axis category labels wrapped to two lines at the original `height={280}`/`width={150}` and overlapped adjacent rows for long status names ("Proposta em preparação", "Conversa agendada") — fixed by shortening the on-axis labels (full names moved to the tooltip via a new `STATUS_FULL_LABELS` map) and making the chart height dynamic (`data.length * 34`) so rows never compress below a safe minimum. (2) The income/expense and leads-volume empty-state checks only tested `.length === 0`, so a month with real entries but all-zero values (e.g. no transactions yet) rendered an empty, contextless axis grid instead of the "Nenhum X registrado" message — fixed by switching both checks to `.every(...)` over the zero condition, which also subsumes the empty-array case.

## Spec Change Log

## Review Triage Log

Three layers (Blind Hunter, Edge Case Hunter, Verification Gap) reviewed the diff. All findings verified against actual code before routing.

- **low — patch**: `formatMonth` is duplicated verbatim in `income-expense-chart.tsx` and `leads-volume-chart.tsx`. Verified: both files contain the identical function. Fix: extract to a shared util.
- **medium — patch**: no test exercises `PainelIndexPage`'s `isSuperAdmin` gate — an `employer` never seeing financeiro/contratos sections/fetches, and a `super_admin` seeing them, is asserted nowhere. Verified: no test file for `src/app/painel-8f2k/page.tsx` exists, and the library-level finance/contracts tests never import or render the page component. A flipped or dropped role check would ship undetected. Fix: add a component test rendering the page for both roles.
- **low — patch**: chart `<ResponsiveContainer>`/SVG elements have no accessible name (no `aria-label`/`role="img"`), so screen readers get an effectively empty graphic even though an adjacent `<h3>` names it visually. Fix: add `aria-label` to each chart's wrapper describing the chart.
- **low — patch**: the "Contratos" section renders a `sm:grid-cols-3` grid with a single `StatCard`, leaving two visibly empty grid slots. Fix: drop the forced 3-column grid for a single-card layout.
- **low — reject**: color hex values are repeated across the 4 new chart files and `stat-card.tsx` instead of centralized as tokens. Real but developer-only, no user-facing harm, and the fix (extracting a shared palette module across 5 files) is more than a direct correction — rejected per the low-finding bar.
- **low — reject**: `leads-funnel-chart.tsx`'s tooltip `labelFormatter` reads `payload?.[0]?.payload?.fullLabel` with recharts' loose typing. Verified the access is already null-safe (`?.` chain with `?? ""` fallback) — a shape change degrades the tooltip text, it doesn't crash. Cosmetic, not a real defect.
- **false**: Blind Hunter flagged `balanceError`/`chartsError` as "coarse", hiding whether only one of the two `getFinancialCharts`-backed charts failed. Verified: `incomeExpenseByMonth` and `expenseByCategory` both come from one `getFinancialCharts` call by the existing (Epic 5) function contract — there is no finer-grained failure to distinguish; this is the pre-existing shape, not a gap introduced here.
- **false**: Blind Hunter suggested `listContracts(..., { page: 1, page_size: 1 })` wastefully fetches a row just to read `.total`. Verified: this is the same technique already used by `list-contracts.ts`'s own callers elsewhere and is explicitly the approach the spec's Code Map called for (no dedicated count-only query exists in this codebase to reuse instead).
- **false**: Blind Hunter raised a concern that `getProspectingOverview` runs for every admin role including `employer`, without visible scoping. Verified: `getProspectingOverview` (`src/lib/leads/get-prospecting-overview.ts`) takes no `admin`/role parameter at all and relies on `leads` table RLS exactly as `listLeads` already does on the existing Leads page, which both roles already access today — not a new exposure, matches established precedent.
- **false**: Edge Case Hunter flagged `getCurrentAdmin()`/`createClient()` throwing as uncaught, crashing the whole page instead of degrading gracefully. Verified: this exact unguarded call shape (`const admin = await getCurrentAdmin(); if (!admin) redirect(...)`) is the established pattern in every other admin page (`contratos/page.tsx:47`, `financeiro/page.tsx:48`) — not a regression introduced by this diff.
- **low — reject**: Edge Case Hunter flagged `formatMonth`/currency formatters producing `"undefined/NN"` or `"NaN"` labels if a `month` string lacks `-` or a value is non-numeric. Verified both inputs are backend-guaranteed shapes (`"YYYY-MM"` strings and summed numeric aggregates from the existing, already-tested finance/leads functions) — not reachable through any real code path, only through data that cannot occur.
- **defer**: Blind Hunter noted the page has no `loading.tsx`/`<Suspense>` boundaries, so it blocks on the slowest of four sequential/parallel data calls instead of streaming sections independently. Real architectural observation, but every existing admin page (`contratos`, `financeiro`, `leads`) shares this same synchronous-fetch pattern — not unique to this diff, and changing it here would be a wider architectural shift beyond this story's scope.

**Patches applied:**
- `src/app/painel-8f2k/format-month.ts` (new) — extracted the duplicated `formatMonth` helper, imported by `income-expense-chart.tsx` and `leads-volume-chart.tsx`.
- `src/app/painel-8f2k/page.test.ts` (new) — component test rendering `PainelIndexPage` for `employer` and `super_admin`, asserting the financeiro/contratos sections and their three data-source calls are present only for `super_admin`.
- All 4 chart components — wrapped in `<div role="img" aria-label="...">` describing each chart for screen readers.
- `src/app/painel-8f2k/page.tsx` — contracts section grid changed from a 3-column grid with one populated card to `sm:max-w-xs` so it no longer shows two empty slots.

All patches verified: `npx tsc --noEmit`, `npx eslint`, and `npx vitest run` (60 files / 451 tests) all clean after applying.

## Design Notes

## Verification

**Commands:**
- `npm run lint` -- expected: no new errors
- `npx tsc --noEmit` -- expected: no new type errors
- `npm test` -- expected: existing suite still passes; no test coverage mandated for this page itself since it composes already-tested data functions with no new business logic, but the new `StatCard` component should get a colocated smoke test

**Manual checks (if no CLI):**
- Live browser check as both an `employer` and a `super_admin` test account, verifying section visibility and chart rendering match the Acceptance Criteria
