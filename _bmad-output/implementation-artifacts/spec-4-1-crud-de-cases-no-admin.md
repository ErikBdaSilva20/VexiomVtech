---
title: 'Story 4.1: CRUD de cases no admin (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '85af326'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** FR27/4.1 needs `super_admin`-only create/edit/publish/reorder for portfolio `cases`. RLS (`cases_insert_super_admin`/`cases_update_super_admin`) and the `case-images` Storage bucket already exist (Epic 1). Codex has already built the admin UI (`case-editor.tsx`, `/painel-8f2k/cases`, `/painel-8f2k/cases/[id]`, `/painel-8f2k/cases/novo`) with the submit button intentionally disabled, waiting on this backend.

**Approach:** `createCaseAction`/`updateCaseAction` Server Actions in `src/app/painel-8f2k/cases/actions.ts`, backed by `createCase`/`updateCase` DALs and `createCaseSchema`/`updateCaseSchema`. `published` is accepted only by `updateCaseSchema` — a new case is always `published: false` (`createCase` forces it server-side, ignoring any client input), matching the AC's explicit "novo case é criado com published = false por padrão"; publishing/unpublishing and reordering (`display_order`) both happen through the same `updateCase` path since the AC never describes them as separate flows.

**Existing-pattern flag (Anti-Vibe-Coding Gate #2):** `cases.updated_at` had a DB default but no trigger refreshing it on UPDATE — every other "auto-touch a timestamp" case in this schema (`leads.last_interaction_at`) is a DB trigger, not application code. Since this story adds the first UPDATE path to `cases`, fixed the gap with a new migration (`0004_cases_updated_at_trigger.sql`) rather than leaving the admin list's "última atualização" column permanently stale or duplicating the fix in every future write path.

## Boundaries & Constraints

**Always:**
- `createCaseAction`/`updateCaseAction` check `getCurrentAdmin()` and `role === "super_admin"` explicitly (defense-in-depth) even though RLS also enforces it — matches the page-level `redirect` already in place, and gives a specific error instead of an opaque RLS 42501.
- `tech_stack` is parsed from a single comma-separated string field (matching `case-editor.tsx`'s actual input), trimmed, empty entries dropped.
- A unique-slug violation (`23505`) or an invalid `project_id` FK violation (`23503`) surface as specific field-relevant messages, not a generic error.
- `cases.updated_at` is refreshed by a DB trigger on every UPDATE.

**Never:**
- `createCaseSchema` never accepts `published` — only `updateCaseSchema` does.
- No optimistic-concurrency guard on `updateCase` — cases are a single-super_admin-persona resource, not contended between multiple admins acting on the same record (unlike leads); last-write-wins is an accepted simplification here.
- No delete action — not in this story's AC.
- No page/component changes — the existing admin UI (submit disabled, "aguardando integração" notice) is Codex's to wire up once these actions exist.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Create with required fields | super_admin session | New `cases` row, `published: false` regardless of any client-sent value | N/A |
| Create with a taken slug | — | `duplicate_slug` error | N/A |
| Create with an unknown `project_id` | — | `invalid_project` error | N/A |
| Update any field, including `published`/`display_order` | Existing case | Row updated, `updated_at` refreshed by trigger | N/A |
| Action invoked by an `employer` or unauthenticated caller | — | Rejected before any DB call, specific message | N/A |
| Action invoked with malformed fields | — | Field-level errors, no DB write | N/A |

</frozen-after-approval>

## Code Map

- `supabase/migrations/0004_cases_updated_at_trigger.sql` (new) -- `set_cases_updated_at()` trigger, mirroring `set_lead_last_interaction_at()`'s style; `supabase/migrations.sql` regenerated via `pnpm db:migrations`. `supabase/setup.sql` left untouched per the project's established migration convention.
- `src/lib/leads/lead-schema.ts` -- `optionalText`/error-message style reused (a local copy, not imported — see Implementation Notes).
- `src/app/painel-8f2k/leads/[id]/actions.ts` -- Server Action shape (`_prevState`/`FormData`/typed `*State` union) and field-error convention followed.
- `src/components/cases/case-editor.tsx` (Codex, read-only reference) -- exact field names (`title`, `slug`, `category`, `client_name`, `project_id`, `description`, `problem_solved`, `motivation`, `external_link`, `tech_stack`, `display_order`, `is_founder_project`, `published`) confirmed from the existing form markup so the Server Actions accept the same `FormData` shape without requiring a frontend rewrite.

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/0004_cases_updated_at_trigger.sql` -- new trigger + `pnpm db:migrations`
- [x] `src/lib/cases/case-schema.ts` -- new `createCaseSchema`, `updateCaseSchema`
- [x] `src/lib/cases/write-case-error.ts` -- new `classifyWriteCaseError`
- [x] `src/lib/cases/create-case.ts` -- new `createCase(supabase, input)`
- [x] `src/lib/cases/update-case.ts` -- new `updateCase(supabase, input)`
- [x] `src/app/painel-8f2k/cases/actions.ts` -- new `createCaseAction`, `updateCaseAction`
- [x] Tests for all new modules

**Acceptance Criteria:** see I/O matrix above (mirrors FR27 ACs verbatim; the "employer denied" AC is covered by the existing page-level redirect plus this story's explicit in-action role check).

## Implementation Notes

- Implemented directly, self-reviewed inline (no subagent dispatch), per standing token-conservation instruction.
- Considered extracting `optionalText`/`MAX_SHORT_TEXT`/`MAX_LONG_TEXT` out of `lib/leads/lead-schema.ts` into a shared module instead of duplicating them in `case-schema.ts`, since the logic is identical. Deferred: doing so touches 4 already-`review`-status Epic 2 files for a same-turn, cross-epic refactor outside this story's scope. Surfacing as a suggestion rather than doing it — worth a small dedicated cleanup pass later.
- `z.url()` (not `z.string().url()`) and a `.transform().pipe(z.uuid().nullable())` chain for the optional `project_id` field confirmed via throwaway scripts before use — same category of zod-version check as prior stories.
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (233 tests) all pass.
- Not verified against a live Supabase instance — no CLI/DB access in this environment.

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 233 tests pass, including new coverage for `case-schema.ts`, `write-case-error.ts`, `create-case.ts`, `update-case.ts`, and `actions.ts`
