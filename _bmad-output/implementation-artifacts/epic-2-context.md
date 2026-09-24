# Epic 2 Context: Captação e Gestão de Leads

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic covers the full lead lifecycle for Vexiom: a public visitor submits a contact form that creates a lead, the system flags likely duplicates without blocking creation, admins can also register leads manually, and the admin team manages each lead through search/filters, a timeline of interactions, status changes (with automatic history), qualification fields (next action, probability, tags, non-conversion reason, assignee), and scheduled meetings. It is the core CRM surface of the admin panel, feeding the prospecting health dashboard (Epic 3). Note: `_bmad-output/planning-artifacts` does not exist in this repo, so no PRD/architecture/UX/product-brief docs were available to cross-reference — this context is compiled solely from `docs/stories/epics.md` and the existing Epic 1 Supabase implementation.

## Stories

- Story 2.1: Envio de lead pelo formulário público
- Story 2.2: Detecção de duplicidade na criação de lead
- Story 2.3: Cadastro manual de lead pelo admin
- Story 2.4: Listagem de leads com busca e filtros
- Story 2.5: Timeline de interações do lead: mensagens e notas
- Story 2.6: Marcar lead como visualizado e respondido
- Story 2.7: Alterar status do lead com histórico automático
- Story 2.8: Qualificar e organizar o lead
- Story 2.9: Agendar e gerenciar reuniões do lead

## Requirements & Constraints

- The public contact form captures: nome, empresa, e-mail, WhatsApp, tipo de projeto, descrição, prazo desejado, faixa de investimento, melhor canal/horário. Required fields: nome, e-mail, WhatsApp, tipo de projeto, descrição; the rest are optional and nullable. The visitor must get a clear success or error message, and a client-side validation error must never report the lead as created when it wasn't.
- Public lead writes must not rely on an anonymous RLS insert policy — they go through a server-side Route Handler using the service role key, which must never reach the browser. Every payload from the public form must be validated with Zod before any DB write.
- On every lead creation (public form or manual admin entry), the system checks for an existing lead sharing the same e-mail or WhatsApp and, if found, fills `possible_duplicate_of` with the id of the oldest matching lead — this never blocks creation. The lead detail view must show a visible warning with a link to the original lead when `possible_duplicate_of` is set.
- Manual admin lead creation (`/painel-8f2k/leads/novo`) requires the same required fields plus `source` (e.g. indicação, evento, Instagram), sets `created_by` to the admin, and runs the same duplicate detection.
- Lead listing needs combinable search (nome/empresa/e-mail/WhatsApp) and filters (status, tag, tipo de projeto, responsável), intersecting all active criteria, with a clear empty-state message.
- Lead detail shows a full interaction timeline (mensagens enviadas, mensagens recebidas, notas, mudanças de status) in chronological order with exact timestamp and authorship; "mensagem recebida" entries have no admin author since clients have no account.
- `viewed_at` is set automatically the first time an admin opens a lead's detail and is never overwritten afterward; `responded_at` is set only by explicit manual admin action.
- Lead status is a closed enum: novo lead, em análise, primeiro contato realizado, conversa agendada, proposta em preparação, proposta enviada, follow-up pendente, contrato fechado, não convertido, em suporte contínuo. Invalid values must be rejected by the enum constraint. Every status change must automatically append a `mudanca_status` timeline entry describing old and new status — this happens via a database trigger, not application code, so it fires regardless of the code path that changed the status.
- Qualification fields: `next_action` (text) + `next_action_at` (datetime) for follow-up scheduling; `probability` (baixa/média/alta); free-form `tags`; `non_conversion_reason` (only meaningful/editable when status is `nao_convertido`); `assigned_to` referencing an admin user — all shown on both list and detail views.
- Meetings: a lead can have multiple `lead_meetings` rows, each independently scheduled, marked `realizada`, or cancelled, preserving historical record.
- `last_interaction_at` on `leads` must be maintained via a database trigger on `lead_interactions` inserts, not computed with a `MAX()` aggregate at read time — this feeds Epic 3's cooling-lead detection cheaply.
- "12 business hours since creation" checks (used by Epic 3, but rooted in this epic's data) must exclude weekends; national holidays are explicitly out of scope.
- RLS policies on `leads`, `lead_interactions`, `lead_meetings` (and other tables) must go through the `app_current_role()` SECURITY DEFINER function rather than querying `admin_users` directly, to avoid RLS recursion.
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only code exclusively).

## Technical Decisions

- Supabase client factories already exist and should be reused as-is, not recreated: `createClient()` in `src/lib/supabase/client.ts` (browser, anon key, for Client Components), `createClient()` in `src/lib/supabase/server.ts` (async, cookie-aware, for Server Components/Actions/Route Handlers, anon key + RLS), and `createAdminClient()` in `src/lib/supabase/admin.ts` (service role key, bypasses RLS, guarded by `server-only`, intended for exactly this kind of use — e.g. the public `POST /api/leads` endpoint that must write without an anon insert policy).
- Env vars are read through the helpers in `src/lib/supabase/env.ts` (`getSupabaseUrl`, `getSupabaseAnonKey`, `getSupabaseServiceRoleKey`), which throw a clear error naming the missing var — use these instead of reading `process.env` directly.
- The `leads`, `lead_interactions`, and `lead_meetings` tables, the `app_current_role()` SECURITY DEFINER RLS helper, and the two required triggers (status-change → `lead_interactions` insert; `lead_interactions` insert → `leads.last_interaction_at` update) already exist in `supabase/setup.sql` and `supabase/migrations/0001_initial_schema.sql` from Epic 1's initial schema migration — Epic 2 work should reuse this schema, not redefine it.
- Schema convention: `supabase/setup.sql` holds the idempotent full base schema (safe to re-run; every statement uses `IF NOT EXISTS`/`OR REPLACE` or drop-then-recreate) and is the reference/bootstrap file for a fresh project. Incremental changes must NOT be hand-edited into `setup.sql` directly — add a new numbered file under `supabase/migrations/` instead. `supabase/migrations.sql` is a generated file (via `pnpm db:migrations` / `scripts/generate-supabase-migrations.mjs`) that concatenates all files in `supabase/migrations/` in filename order for one-shot pasting into the Supabase SQL editor — never hand-edit it either. Any new Epic 2 schema tweaks (if the existing tables need adjustment) should follow this same two-file convention.

## Cross-Story Dependencies

- Story 2.2 (duplicate detection) is reused by both 2.1 (public form) and 2.3 (manual admin creation) — implement it once and call it from both paths.
- Story 2.7's automatic status-change timeline entries and Story 2.5's manual timeline entries share the same `lead_interactions` table and rendering in the lead detail timeline.
- Story 2.8's `next_action`/`next_action_at` and Story 2.9's `lead_meetings.scheduled_at` are both consumed later by Epic 3's follow-up/meeting highlight and Epic 3's cooling-lead logic depends on `last_interaction_at`, which Story 2.5's interaction inserts (via trigger) keep current.
