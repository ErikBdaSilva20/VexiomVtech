# Epic 1 Context: Autenticação e Acesso Administrativo

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Establish the authentication and authorization foundation for the entire administrative area. Administrators must be able to log in with email/password, have the system recognize one of two roles (`super_admin` or `employer`), and have every route under the admin prefix protected accordingly. This epic is a prerequisite for all subsequent admin-facing epics (leads, prospecting dashboard, cases, projects/financial) since they all depend on session and role enforcement being in place first.

## Stories

- Story 1.1: Login administrativo com reconhecimento de papel
- Story 1.2: Proteção de rotas administrativas por sessão e papel

## Requirements & Constraints

- Admins log in via Supabase Auth (email + password) at `/painel-8f2k/login`. There is no public signup/invite screen in this phase — `super_admin` and `employer` accounts are created manually via SQL/Supabase dashboard by the two founders.
- Every route under the admin prefix must require a valid authenticated session (NFR1).
- Two roles exist: `super_admin` (full access) and `employer` (leads module only — no access, not even read-only, to cases, projects, or financial data) (NFR2).
- A user authenticated in Supabase Auth but without a corresponding `admin_users` row must be treated as unauthorized, even with a valid Supabase session.
- No session → redirect to `/painel-8f2k/login`. Valid session but insufficient role for the target route (e.g. `employer` hitting `/painel-8f2k/cases` or `/painel-8f2k/financeiro`) → redirect to `/painel-8f2k/leads`. Valid `super_admin` session → access granted to everything under the admin prefix.
- Invalid login credentials show an error message and create no session.

## Technical Decisions

- The admin area lives under the non-obvious route prefix `/painel-8f2k` (not `/admin`) as an extra deterrence layer against URL guessing — real protection is still session + RLS, not the prefix itself. Renaming it later is just a route-folder rename.
- `admin_users` table (`user_id` uuid pk → `auth.users.id` on delete cascade, `role` text check in `('super_admin', 'employer')`, `name` text nullable, `created_at`) is the source of truth for role — Supabase Auth itself has no role concept.
- A `app_current_role()` SQL function (`SECURITY DEFINER`) reads `admin_users` and is reused by RLS policies on other tables to avoid RLS recursion when a policy needs to check the caller's own role.
- `admin_users` RLS: each user may only read their own row (`auth.uid() = user_id`) — sufficient for the app to discover the logged-in user's role.
- `middleware.ts` in Next.js enforces protection for all of `/painel-8f2k/*` except `/painel-8f2k/login`: checks session validity and role-route eligibility before allowing access.
- `/painel-8f2k` itself (no sub-path) redirects to `/painel-8f2k/leads`.
- Required env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; `SUPABASE_SERVICE_ROLE_KEY` is server-only and must never reach the browser (not directly needed by this epic's stories, but the Supabase server/browser client setup this epic relies on must respect this split).
- Suggested overall implementation order places this epic's work (auth middleware + login) as step 4, after DB migrations/RLS (step 1) and Supabase clients (step 2) — i.e. `src/lib/supabase/` clients (anonymous browser client, service-role server client) should already exist or be established as part of getting this epic's login flow working.

## Cross-Story Dependencies

- This epic is a foundational dependency for Epics 2–5: every admin route built afterward (`/painel-8f2k/leads*`, `/painel-8f2k/cases*`, `/painel-8f2k/financeiro*`) relies on the middleware and role model established here.
- Story 1.2 (route protection) depends on Story 1.1 (login + role recognition) being functional, since the middleware needs a working session/role lookup to enforce.
