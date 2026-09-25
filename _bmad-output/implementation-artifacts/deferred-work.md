- source_spec: `_bmad-output/implementation-artifacts/spec-vexiom-home-page.md`
  summary: Add a "NOSSAS SOLUÇÕES" divider and a third ProjectsSection (featured case + stats) below Services.
  evidence: prompt.md and the mockup PNG both call for a 3rd section, but the user's later explicit instruction ("home-reference.html precisa ser 100% idêntico, nada diferente") makes that file the literal source of truth for this pass, and it only contains Header+Hero+Services — no divider, no Projects. Dropped from current scope to honor the "nothing different" constraint; revisit if the user wants to extend beyond the reference file.
- source_spec: `_bmad-output/implementation-artifacts/spec-vexiom-home-page.md`
  summary: Add a visible affordance (or real destinations) for the inert "Cases"/"Como trabalhamos" nav items so they don't read as broken links to sighted mouse users.
  evidence: Blind Hunter review flagged that these spans are visually identical to real nav links with no disabled/coming-soon styling. Real usability concern, but this exact behavior is mandated by home-reference.html (the frozen 100%-identical source of truth) and the user's explicit "nada diferente" instruction — fixing it now would mean a visible deviation from the reference. Revisit once Produtos/Sobre nós/Portfólio pages exist, or if the pixel-fidelity constraint is relaxed.
- source_spec: `_bmad-output/implementation-artifacts/spec-vexiom-home-page.md`
  summary: Add a fallback contact path (visible/copyable email text, or a real contact form) alongside the mailto: CTAs.
  evidence: Blind Hunter review flagged that every CTA on the page is a mailto: link with no fallback for visitors without a configured mail client. Real conversion-path risk, but mailto-only matches home-reference.html exactly and the user already confirmed contato@vexiom.com.br as the channel for this pass; docs/plans/06-operacao-comercial-e-contato.md already earmarks a proper interest form as a later phase — revisit then.
- source_spec: `_bmad-output/implementation-artifacts/spec-tailwind-header-hero.md`
  summary: Migrate Header styling (site-header.tsx, primary-nav.tsx) from globals.css to Tailwind utility classes.
  evidence: Original spec covered Header + Hero together but exceeded the ~1600-token spec size guideline; split into two independently shippable deliverables. Hero goes first (contains the button the user specifically wants to resize); Header follows as its own spec once Hero migration is verified.
- source_spec: none
  summary: POST /api/leads (Zod validation, insert) and duplicate-lead detection (possible_duplicate_of) for the public contact form — Stories 2.1/2.2 backend.
  evidence: Split from the Epic 1 build (foundation + auth) so it ships as its own independently reviewable PR. Uses the same migration/clients as Epic 1, just consumed by a different endpoint (public form intake vs admin auth).
- source_spec: `_bmad-output/implementation-artifacts/spec-1-epic-1-auth-fundacao-supabase.md`
  summary: Add rate limiting/lockout on the admin login Server Action.
  evidence: Blind Hunter review flagged no app-level rate limiting on `signInWithPassword`. Supabase Auth (GoTrue) applies its own server-side rate limiting by default, and this is a 2-user internal tool per doc 08, so the current exposure is low. Revisit if the admin user base grows or if Supabase's default throttling proves insufficient.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-epic-1-auth-fundacao-supabase.md`
  summary: Decide `ON DELETE` referential-action policy (`CASCADE` vs `SET NULL` vs keep blocking `NO ACTION`) for the FKs referencing `admin_users`/`leads`/`projects` (`leads.assigned_to`, `leads.created_by`, `leads.possible_duplicate_of`, `lead_interactions.author_id`, `financial_transactions.partner_id`/`created_by`, `projects.lead_id`, `cases.project_id`).
  evidence: Edge Case Hunter review flagged that all these FKs default to `NO ACTION`, so deleting a referenced `admin_users`/`leads`/`projects` row will fail with a Postgres FK violation. Doc 08 never specifies the intended behavior (e.g. should removing an admin null out their historical `created_by` attribution, or should that be blocked?), and no epic currently ships a delete flow for any of these entities, so there is no live trigger path yet. Needs a product decision, not a code guess.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-envio-de-lead-pelo-formulario-publico.md`
  summary: Add rate limiting / spam protection (throttle, honeypot, or CAPTCHA) and an Origin/Referer allow-list on `POST /api/leads`.
  evidence: Blind Hunter review flagged that the endpoint writes with the service-role client and has no server-side throttle or origin check, so a scripted flood can fill `leads` with junk from any external caller. No rate-limiting infra exists anywhere in the project yet, so the smallest fix is not simple — needs a product decision on acceptable friction (CAPTCHA vs honeypot vs IP throttle) before implementation.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-envio-de-lead-pelo-formulario-publico.md`
  summary: Decide a normalized format/pattern for `leads.whatsapp` (digits only, `+55` prefix, length) instead of accepting any non-empty string.
  evidence: Blind Hunter review flagged that `whatsapp` has no format validation today. No FR/epic doc defines the expected format. Story 2.2 (duplicate detection by WhatsApp) will need a normalized shape to compare reliably, so this should be settled before or during that story rather than guessed now.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-envio-de-lead-pelo-formulario-publico.md`
  summary: Decide whether `preferred_channel` and `preferred_time` should be closed enums instead of free text.
  evidence: Blind Hunter review flagged these look like they should be a fixed set of options (e.g. channel: whatsapp/email/phone) but no FR/epic doc defines the taxonomy, so free text was kept to avoid guessing values the product doesn't specify. A typo'd value would silently pass validation and fragment admin-side filtering/reporting once story 2.4 (search/filters) exists.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-listagem-de-leads-com-busca-e-filtros.md`
  summary: `listLeads` search is ASCII case-insensitive only (`ilike`); accented Portuguese terms won't fuzzy-match their unaccented form (e.g. "joao" won't match "João").
  evidence: No FR requires accent-insensitive search; would need `unaccent`/a trigram index or normalization on both sides. Revisit if search quality becomes a real complaint once the leads list page ships.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-4-listagem-de-leads-com-busca-e-filtros.md`
  summary: `%`/`_` typed by a user in the search box are escaped and matched literally, not treated as user-controlled wildcards.
  evidence: Deliberate safe default (also closes off a minor DoS vector from pathological wildcard patterns); no requirement asks for user-controlled SQL-style wildcards in the search box.
- source_spec: `_bmad-output/implementation-artifacts/spec-5-1-cadastro-de-projetos-internos.md`
  summary: Consider auto-clearing `projects.finished_at` when a `concluido` project's status is moved back to `em_andamento`/`cancelado`.
  evidence: Blind Hunter review — currently the field is left stale (still shows the old completion date) after reopening a project; no AC requires this, and it's a debatable UX call (admin can already edit the field directly), so deferred rather than patched.
- source_spec: `_bmad-output/implementation-artifacts/spec-contratos-cadastro-e-upload-encriptado.md`
  summary: Download/decrypt endpoint for the attached contract file, plus a `contract_access_log` table recording who opened/downloaded it and when.
  evidence: Multi-goal split — cadastro (this spec) is independently shippable and already large (migration + storage + crypto + domain layer). Download+log is its own deliverable, gated on super_admin, that reads the file this spec writes. Do next, since the file is useless without a way to read it back.
- source_spec: `_bmad-output/implementation-artifacts/spec-contratos-cadastro-e-upload-encriptado.md`
  summary: Listing/history query surfacing all registered contracts (metadata in clear text) for super_admins.
  evidence: Multi-goal split — independently shippable read-side deliverable, depends only on the `contracts` table from this spec, not on the download/log story.
- source_spec: `_bmad-output/implementation-artifacts/spec-contratos-download-e-log-de-acesso.md`
  summary: Decide `ON DELETE` referential-action policy for `contract_access_log.contract_id`'s FK to `contracts.id` (currently `NO ACTION`, blocking any future contract delete once it has an access-log row).
  evidence: Blind Hunter review — same open class of issue as the existing Epic-1 deferred item on `admin_users`/`leads`/`projects` FKs. No epic ships a delete flow for `contracts` yet, so no live trigger path; needs a product decision (cascade vs. block), not a code guess.
- source_spec: `_bmad-output/implementation-artifacts/spec-admin-dashboard-overview.md`
  summary: Add loading.tsx/Suspense boundaries so the admin dashboard streams sections independently instead of blocking on the slowest of four data calls.
  evidence: Blind Hunter review flagged this during the dashboard build. Real architectural improvement, but every existing admin page (contratos, financeiro, leads) shares the same synchronous full-page-fetch pattern today — not unique to the dashboard, and fixing it here alone would be inconsistent. Revisit as a codebase-wide admin data-fetching pattern change if page load times become a real complaint.
- source_spec: `_bmad-output/implementation-artifacts/spec-leads-drilldown.md`
  summary: Add jsdom/testing-library to the project so client-hook fetch/state-transition flows (e.g. `useLeadDrilldown`'s loading→success/error) can be tested at the DOM level.
  evidence: Verification-gap review flagged that `useLeadDrilldown`'s open()→fetch→state-transition flow has no DOM-level test, only pure-function coverage. `vitest.config.ts` runs a `node` environment with no jsdom/testing-library anywhere in the repo — a pre-existing, project-wide testing gap, not introduced by this story. Revisit if client-side interactive components become more common.
