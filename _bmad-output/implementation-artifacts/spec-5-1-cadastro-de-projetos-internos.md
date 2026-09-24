---
title: 'Story 5.1: Cadastro de projetos internos'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `super_admin` has no way to create or update internal `projects` rows (title, client, status, dates, optional lead link) — the `projects` table, its RLS, and DB types already exist (base schema), but there is no domain/server-action layer to write to it. Backend-only scope; UI pages/forms are owned separately (Codex).

**Approach:** Mirror the `src/lib/cases/` domain-layer pattern (Zod schema, `create-project.ts`, `update-project.ts`, `write-project-error.ts`, colocated tests) plus a `src/app/painel-8f2k/projetos/actions.ts` Server Actions file mirroring `src/app/painel-8f2k/cases/actions.ts`'s `requireSuperAdmin` guard, so a future page can call these actions directly. No migration needed — `projects` table/RLS/types already ship in `supabase/migrations/0001_initial_schema.sql` and `src/lib/supabase/database.types.ts`. The case→project link (FR31 AC4) is already implemented via the existing `updateCase`/`case-schema.ts` `project_id` field — confirmed already satisfied, no new work there.

</frozen-after-approval>

## Implementation Notes

- Confirmed `projects` table, its `projects_all_super_admin` RLS policy, and `ProjectsRow`/`ProjectsInsert`/`ProjectsUpdate`/`ProjectStatus` types already exist (`supabase/migrations/0001_initial_schema.sql`, `src/lib/supabase/database.types.ts`) — no migration added.
- Confirmed `cases.project_id` + `case-schema.ts`'s `project_id` field + `src/app/painel-8f2k/cases/project-options.ts` already implement the case→project link (FR31) end-to-end — no changes made there.
- Added `finished_at` required-when-`concluido` as a Zod `.refine` on both create/update schemas (AC2's "finished_at preenchido quando concluído" reads as a business rule, not just a DB default) — enforced at the validation boundary before any Supabase call.
- Files added: `src/lib/projects/project-schema.ts`, `write-project-error.ts`, `create-project.ts`, `update-project.ts` (+ colocated `.test.ts` each), `src/app/painel-8f2k/projetos/actions.ts` (+ `.test.ts`). No existing files modified.
- No page/route UI added — `src/app/painel-8f2k/projetos/actions.ts` is ready for a future page to call `createProjectAction`/`updateProjectAction` via `useActionState`, matching the `cases/actions.ts` shape.
- Verification: `npx eslint src/lib/projects src/app/painel-8f2k/projetos` — clean. `npx tsc --noEmit` — clean. `npx vitest run` — 282/282 passing (35 files), no regressions.
- Noted mid-implementation: `src/app/painel-8f2k/projetos/{page,lead-options}.tsx/.ts`, `novo/page.tsx`, `[id]/page.tsx`, and `src/components/projects/project-editor.tsx` already exist on disk (Codex frontend work-in-progress, form intentionally disabled/preview-only, per user). Confirmed field names (`title`, `client_name`, `lead_id`, `status`, `started_at`, `finished_at`) and status enum values already match this story's schema — no coordination changes needed on the backend side.

## Review Triage Log

Blind Hunter (context-free subagent) reviewed the diff; 8 findings, all checked against the actual files before acting:

- `finished_at` not validated against `started_at` ordering — **high** (real, silently accepted nonsensical data). Fixed: added `superRefine` date-ordering check to `project-schema.ts` + 2 tests.
- No test coverage for `title`/`client_name` max-length and blank-to-null trim — **low** (real gap, cheap fix). Fixed: added 2 tests to `project-schema.test.ts`.
- No test for a malformed (non-UUID) `project_id` on update — **low** (real gap, cheap fix; behavior itself was already correct via `z.uuid()`). Fixed: added 1 test.
- `finished_at` left stale when a `concluido` project reopens — **low**, rejected: no AC requires auto-clearing, admin can edit the field directly, and auto-clearing user-entered data on a status change is a debatable UX call outside this story's scope. Logged to `deferred-work.md`.
- No `revalidatePath` after create/update — **false**: verified `src/app/painel-8f2k/cases/actions.ts` (the pattern this story mirrors) also has no `revalidatePath` call; this matches established convention, not an omission introduced here.
- Generic "unknown" error instead of a specific "project not found" message on a nonexistent `project_id` update — **false**: verified `update-case.ts`/`update-case.test.ts` has the exact same behavior ("returns unknown when the case doesn't exist"); intentional existing convention, not a regression.
- `loadProjectLeadOptions` swallows errors, returns `[]` — **out of scope**: file predates this story (Codex frontend work), and mirrors the same pattern already in `src/app/painel-8f2k/cases/project-options.ts`.
- Duplicated status-pill ternary in `page.tsx` — **out of scope**: Codex-owned frontend file, not touched by this story.
