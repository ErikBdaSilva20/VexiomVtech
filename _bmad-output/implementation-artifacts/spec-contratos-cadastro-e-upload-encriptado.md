---
title: 'Contratos: cadastro com anexo encriptado'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '08e58179c8e99032847eb5ec5547107e8a396a8e'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** There is no way to record a closed contract with a lead (service type(s), amount, optional hours for "demanda" work) or to keep the signed contract file itself, which often contains sensitive data. Backend-only scope; listing UI and access-log UI are Codex's.

**Approach:** Add a `contracts` table (required metadata: lead, service types, amount, hours-if-demanda; optional `file_object_path`) plus a private Supabase Storage bucket. When a PDF is attached, encrypt it application-side (AES-256-GCM, Node `crypto`, symmetric key from a server-only env var) before upload — the bucket never holds plaintext. Domain layer + a `createContractAction` Server Action, gated by `requireSuperAdmin`, following the same layering as `src/lib/projects`/`src/lib/finance`.

## Boundaries & Constraints

**Always:** Metadata fields (lead, service types, amount, hours) are required and stored in clear text, protected only by RLS (`app_current_role() = 'super_admin'`) — they are not encrypted. Only the attached file is encrypted. The encryption key lives in a server-only env var, never sent to the client. Uploads/decryption happen only in Node-runtime server code (no `export const runtime = 'edge'` anywhere in this codebase — confirmed).

**Never:** No download/decryption endpoint or access-log table in this story — deferred (see `deferred-work.md`). No listing/history query in this story — deferred. Do not reuse the public `case-images` bucket pattern; this bucket must be private with no public policy.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Contract without file | Valid metadata, no file | Row inserted, `file_object_path` null | N/A |
| Contract with file | Valid metadata + PDF | File encrypted client-side-of-server (in the action, before upload), uploaded under a random object name, row inserted with path | Upload failure after encryption → no row inserted, user-facing error |
| hours required when demanda | `service_types` includes a "demanda" kind, `hours` missing | Validation rejects | `invalid_hours` |
| Invalid lead | `lead_id` does not exist | FK violation classified | `invalid_lead` |
| Non-super_admin caller | `admin.role !== 'super_admin'` | Action returns denied state before any DB/storage call | N/A |
| Oversized/wrong-type file | File not a PDF, or over size cap | Rejected before encryption | `invalid_file` |

</frozen-after-approval>

## Code Map

- `supabase/migrations/0001_initial_schema.sql:350-376` -- model for a new migration: storage bucket + `storage.objects` RLS policies (copy the shape, but bucket must be `public: false`)
- `supabase/migrations/` (latest: `0004_cases_updated_at_trigger.sql`) -- new migration `0005_contracts.sql` goes here: `contracts` table + RLS via `app_current_role() = 'super_admin'` (all CRUD) + private `contracts` storage bucket + its policies
- `src/lib/cases/case-image-upload.ts:23-43,73` -- MIME/magic-byte validation pattern and `crypto.randomUUID()` object naming to mirror (but target bucket is private, and content is pre-encrypted)
- `src/lib/supabase/env.ts` -- `requireEnv(name)` getter pattern; add the new encryption-key getter here or a colocated `src/lib/contracts/env.ts`
- `src/lib/auth/require-super-admin.ts`, `src/lib/auth/get-current-admin.ts` -- reuse as-is for the action guard and `created_by`
- `src/lib/finance/write-transaction-error.ts` -- error-classifier pattern to mirror for `write-contract-error.ts` (FK on `lead_id` → `invalid_lead`)
- `src/lib/supabase/database.types.ts` -- add `Contracts` row/insert/update types after the migration lands

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/0005_contracts.sql` -- create `contracts` table (`id`, `lead_id` FK, `service_types` text[], `amount` numeric, `hours` numeric nullable, `file_object_path` text nullable, `created_by` FK `admin_users.user_id`, `created_at`) + RLS (`app_current_role() = 'super_admin'` for select/insert/update/delete) + private `contracts` storage bucket + its RLS policies -- schema + storage foundation, mirrors existing migration conventions
- [x] `src/lib/contracts/contract-schema.ts` -- Zod schema: `lead_id` uuid, `service_types` non-empty array of an enum, `amount` string-regex-then-cents (mirror `transaction-schema.ts`'s float-precision fix), `hours` optional, `.superRefine` requiring `hours` when a "demanda" service type is present -- money-precision and validation discipline already established in Epic 5
- [x] `src/lib/contracts/encrypt-contract-file.ts` -- `encryptContractFile(buffer): Buffer` using `node:crypto` AES-256-GCM, random 12-byte IV per call, output = `iv || authTag || ciphertext`, key from env getter -- keeps the crypto primitive isolated and unit-testable without touching storage
- [x] `src/lib/contracts/write-contract-error.ts` -- classify `23503` (FK) → `invalid_lead`, `23514` (check) → `invalid_hours` -- mirrors `write-transaction-error.ts`
- [x] `src/lib/contracts/create-contract.ts` -- `createContract(supabase, input, createdBy)`: uploads encrypted buffer (if present) to the private bucket under a random object name, then inserts the row with `file_object_path` -- thin wrapper, same shape as `create-transaction.ts`
- [x] `src/app/painel-8f2k/contratos/actions.ts` -- `createContractAction`, `requireSuperAdmin` guard, file-type/size check before encryption -- entry point
- [x] Colocated `.test.ts` for every file above, including edge cases in the I/O Matrix

**Acceptance Criteria:**
- Given a non-super_admin session, when `createContractAction` runs, then it returns a denied state and neither the DB nor storage is touched.
- Given a contract with no file, when created, then the row exists with `file_object_path = null` and no storage object is created.
- Given a contract with a PDF, when created, then the object stored in the bucket is not valid PDF bytes (i.e. it is encrypted, not plaintext) and the row's `file_object_path` matches the uploaded object.

## Implementation Notes

- `service_types` enum (`CONTRACT_SERVICE_TYPES` in `contract-schema.ts`) is not specified verbatim anywhere in the docs — chose `site | sistema_sob_medida | aplicativo | manutencao | consultoria | demanda` as a closed taxonomy covering the business's known offerings plus the required "demanda" kind. Adjust the list if it doesn't match the real catalog; nothing else depends on the exact values beyond `"demanda"` triggering the hours requirement.
- Encrypted object names use a `.bin` extension (random UUID + `.bin`) rather than `.pdf` — deliberate, since the stored bytes are never valid PDF content and the extension shouldn't imply otherwise.
- `createContract` best-effort removes the uploaded object if the subsequent row insert fails (FK/check violation), so a failed contract never leaves an orphaned encrypted blob in the bucket; if that cleanup call itself fails, it's logged but doesn't change the returned error.
- New env var `CONTRACT_FILE_ENCRYPTION_KEY` (32 bytes, hex-encoded) documented in `.env.example`; `getContractFileEncryptionKey()` throws (not returns a default) if missing or the wrong length, so a misconfigured deploy fails loudly on first contract-with-file attempt rather than silently.
- File-attachment validation caps at 10MB (spec didn't specify a limit; `case-image-upload.ts`'s image cap is 5MB, contracts are PDFs so a larger cap seemed reasonable) — adjust `MAX_FILE_SIZE_BYTES` in `actions.ts` if the business wants something else.

## Spec Change Log

## Review Triage Log

Three layers (Blind Hunter, Edge Case Hunter, Verification Gap) reviewed the diff. All findings verified against actual code before routing.

- **medium — patch**: `0005_contracts.sql` has `check (amount > 0)` but no check constraint on `hours`, and `write-contract-error.ts`'s doc comment falsely claims both columns have DB-level check constraints. Worse, `classifyWriteContractError` maps any `23514` to `invalid_hours`, so a real amount-check violation (if Zod is ever bypassed) shows the user "Horas são obrigatórias..." — a wrong message for the actual problem. Fix: add `check (hours is null or hours > 0)` to the migration, distinguish the two check violations by constraint/message substring in the classifier (new `invalid_amount` kind), and correct the doc comment. Reported independently by all three layers (same root cause).
- **medium — patch**: `service_types text[] not null` has no DB-level constraint restricting values to the closed taxonomy or requiring a non-empty array — Zod-only enforcement. This deviates from this codebase's own established convention: `leads.status`, `lead_interactions.status`, `projects.status`, and `financial_transactions.direction` in `0001_initial_schema.sql` all enforce their closed sets with a `check` constraint. Fix: add a `check` constraint on `service_types` (subset-of-taxonomy + non-empty) to `0005_contracts.sql` before it's ever deployed.
- **low — patch**: `validateContractFile`'s `if (file.size === 0) return null` branch is unreachable — its only caller (`createContractAction`) already guards with `file.size > 0` before calling it. Fix is a direct deletion, so kept despite low severity.
- **low — patch**: `src/lib/contracts/env.ts` (`getContractFileEncryptionKey`) has no colocated `env.test.ts`, though the spec's own task list calls for one per file and every sibling file has one. Fix: add it (valid key, missing key throws, wrong-length key throws).
- **low — patch**: `createContract`'s orphan-cleanup `console.error` on a failed `storage.remove()` logs only `removeError`, not `fileObjectPath` — an operator trying to manually clean up an orphaned encrypted blob has no path to find it. Fix: include `fileObjectPath` in that log line.
- **low — patch**: no index on `contracts.lead_id`/`created_by`. Not blocking today, but free to add now (new, undeployed migration) versus a later `ALTER`. Fix: add both indexes to `0005_contracts.sql`.
- **low — reject**: Edge Case Hunter flagged that a `23503` FK violation on `created_by` (not `lead_id`) still maps to `invalid_lead`. Verified real, but `created_by` is never user input — it's set from the authenticated session (`requireSuperAdmin`), so this FK can only fail via a genuine race (the admin's row deleted mid-request). Matches this codebase's own precedent (`write-transaction-error.ts` deliberately doesn't distinguish `project_id`/`partner_id` FKs either, documented inline) — a message-substring fix here is more than a trivial correction for a defect unlikely to be met in practice.
- **low — reject**: `HOURS_PATTERN` (like `AMOUNT_PATTERN`) requires a leading digit, rejecting `.5`. Mirrors `transaction-schema.ts`'s already-reviewed `AMOUNT_PATTERN` exactly (Epic 5) — not a new problem introduced by this diff.
- **low — reject**: encryption key is only validated on first contract-with-file attempt, not at startup/health-check. Matches this codebase's existing lazy `requireEnv`-style validation pattern used for every other env var (e.g. `SUPABASE_SERVICE_ROLE_KEY`) — not a regression introduced here.
- **low — reject**: no test for duplicate or very large `service_types` arrays. Duplicates don't corrupt data or break the "demanda requires hours" rule; no requirement calls for deduplication, and the fix (dedup logic + tests) is more than trivial for negligible real-world benefit.
