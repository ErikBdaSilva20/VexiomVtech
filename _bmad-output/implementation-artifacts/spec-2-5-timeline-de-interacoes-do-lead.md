---
title: 'Story 2.5: Timeline de interações do lead — mensagens e notas (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
baseline_commit: 'e58d214'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Admins need to register and view "nota"/"mensagem_enviada"/"mensagem_recebida" entries on a lead's timeline (FR9/FR10), each with exact date/time and, when applicable, an author. `lead_interactions` and its RLS already exist (Epic 1); no admin-facing write path or read DAL exists yet.

**Approach:** A schema restricted to the three admin-creatable types (excludes `mudanca_status`, which is DB-trigger-only), a Server Action that inserts via the session-aware client (RLS enforces access, same posture as 2.3/2.4), and a read DAL returning the full timeline ordered chronologically. No `/painel-8f2k/leads/[id]` page yet — backend only.

## Boundaries & Constraints

**Always:**
- Restrict the creatable `type` to `nota` | `mensagem_enviada` | `mensagem_recebida` — `mudanca_status` is written only by `trg_leads_log_status_change`.
- `mensagem_recebida` entries always get `author_id: null` — the customer has no admin account (FR9 AC3).
- Any other type gets `author_id` = the calling admin's id, never trusted from client input.
- `occurred_at` defaults to "now" when omitted; when provided, must be a valid ISO datetime (supports retroactive entries per FR9 AC1).
- Reuse `MAX_LONG_TEXT` from `lead-schema.ts` for `content`'s max length rather than a new magic number.
- Use the session-aware `createClient()`, not the service-role client.

**Never:**
- No `/painel-8f2k/leads/[id]` page/component in this story.
- No new RLS policy or migration — `lead_interactions_insert_admins`/`_select_admins` already cover this.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid nota/mensagem_enviada, authenticated admin | Required fields filled | Interaction created, `author_id` = admin id | N/A |
| Valid mensagem_recebida | Required fields filled | Interaction created, `author_id` = null | N/A |
| `type: mudanca_status` submitted | — | Rejected as a field-level error, no DB write | N/A |
| Missing/empty content | — | Field-level error, no DB write | N/A |
| `occurred_at` omitted | — | Stored with current server time | N/A |
| `occurred_at` provided (retroactive) | Valid ISO datetime | Stored as given | N/A |
| Unauthenticated caller | No session | Error, no DB write attempted | N/A |
| Insert fails (RLS/DB error) | — | Generic error returned | Logged server-side |
| Listing a lead's timeline | Multiple interactions exist | Returned ordered by `occurred_at` ascending | N/A |

</frozen-after-approval>

## Code Map

- `supabase/setup.sql` (lines 72-81, 260-282) -- `lead_interactions` table + RLS, reused as-is.
- `src/lib/leads/lead-schema.ts` -- `MAX_LONG_TEXT`/`MAX_SHORT_TEXT` now exported for reuse; module-structure convention followed.
- `src/app/painel-8f2k/leads/novo/actions.ts` -- Server Action shape/pattern this story's action follows (2.3 precedent).
- `src/lib/leads/list-leads.ts` -- read-DAL pattern (throw generic error, log server-side) this story's `listLeadInteractions` follows (2.4 precedent).

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/leads/lead-schema.ts` -- export `MAX_SHORT_TEXT`/`MAX_LONG_TEXT`
- [x] `src/lib/leads/lead-interaction-schema.ts` -- new `createLeadInteractionSchema`
- [x] `src/lib/leads/list-lead-interactions.ts` -- new `listLeadInteractions(supabase, leadId)`
- [x] `src/app/painel-8f2k/leads/[id]/actions.ts` -- new `createLeadInteraction(_prevState, formData)`
- [x] Tests for all new modules

**Acceptance Criteria:** see I/O matrix above (mirrors FR9/FR10 ACs verbatim).

## Implementation Notes

- Implemented directly, self-reviewed inline (no subagent dispatch), per standing token-conservation instruction.
- `z.iso.datetime({ offset: true })` used for `occurred_at` — verified against zod's actual API in this project's version via a throwaway script before committing to it (this project's zod does not expose `.datetime()` as a chainable on `z.string()`, mirroring the earlier `z.uuid()` finding from story 2.4).
- Self-review found one reuse gap before finishing: `content`'s max length was hardcoded to `5000` instead of reusing `lead-schema.ts`'s existing `MAX_LONG_TEXT` — fixed by exporting that constant and importing it here.
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (73 tests) all pass.
- Not verified against a live Supabase instance — no CLI/DB access in this environment.

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 73 tests pass, including new coverage for `lead-interaction-schema.ts`, `list-lead-interactions.ts`, `[id]/actions.ts`
