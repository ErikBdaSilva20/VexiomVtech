---
title: 'Contratos: download decriptado com log de acesso'
type: 'feature'
created: '2026-09-24'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '9239edec583b8bdfc9653c4c5d1bd1a00eee4540'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A contract's attached PDF is stored encrypted (Story 1: `spec-contratos-cadastro-e-upload-encriptado.md`) with no way to read it back, and there is no record of who has opened a given contract's file — both needed before this data is useful, and before Codex can wire a "download" button to anything. Backend-only scope; the download link/button UI is Codex's.

**Approach:** A Node-runtime Route Handler that: authenticates via `requireSuperAdmin`, loads the contract row, downloads the encrypted object from the private `contracts` bucket, decrypts it in memory (AES-256-GCM, same key/layout as upload — GCM's auth tag verification also detects tampering/corruption), logs the access in a new `contract_access_log` table, and streams the plaintext PDF back with `Content-Disposition: attachment`. A contract with no attached file has nothing to download and produces no log entry.

## Boundaries & Constraints

**Always:** The decrypted PDF bytes exist only in memory for the duration of the request — never written to disk, never re-uploaded anywhere. An access log row is written only after a successful decrypt (a failed/corrupted decrypt is not a "someone read this file" event). `contract_access_log` is protected by the same `app_current_role() = 'super_admin'` RLS as `contracts`. If `logContractAccess`'s insert fails after a successful decrypt, the download still succeeds (fail-open) — a lost audit row is worse tolerated than blocking a legitimate super_admin from a contract they're authorized to read; the logging failure itself is logged server-side.

**Never:** No UI/button for triggering the download — Codex's. No listing/history query — the third, still-deferred deliverable. Do not cache the decrypted plaintext anywhere (memory, disk, CDN, response cache headers).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Successful download | Contract exists, has a file, caller is super_admin | 200, PDF bytes, `Content-Disposition: attachment`, one `contract_access_log` row written | N/A |
| Contract has no file | Contract exists, `file_object_path` is null | No download, no log row | 404 |
| Contract not found | `id` doesn't match any row | No download, no log row | 404 |
| Non-super_admin caller | `admin.role !== 'super_admin'` | No storage/DB read at all | 403, no log row |
| Corrupted/tampered ciphertext | GCM auth tag fails to verify on decrypt | No plaintext returned, no log row | 500, generic message (never echo crypto internals) |
| Access-log insert fails after successful decrypt | Transient DB error on `contract_access_log` insert | PDF is still served (fail-open) | Logged server-side, response unaffected |

</frozen-after-approval>

## Code Map

- `src/lib/contracts/encrypt-contract-file.ts` -- byte layout to invert: `iv (12 bytes) || authTag (16 bytes) || ciphertext`, same `CONTRACT_FILE_ENCRYPTION_KEY` via `src/lib/contracts/env.ts`'s `getContractFileEncryptionKey()`
- `supabase/migrations/0005_contracts.sql` -- model for the new migration `0006_contract_access_log.sql`: table + RLS shape to mirror (`app_current_role() = 'super_admin'`), plus its `contracts_lead_id_idx`/`contracts_created_by_idx` pattern for the new table's FK index
- `src/app/api/leads/route.ts` -- Route Handler shape to mirror (try/catch, `NextResponse`/`Response`, no edge runtime declared anywhere in this repo — confirmed, Node is the default)
- `src/lib/auth/require-super-admin.ts`, `src/lib/auth/get-current-admin.ts` -- reuse as-is for the guard and the accessing admin's id
- `src/lib/contracts/write-contract-error.ts`, `create-contract.ts` -- existing domain-layer shape (thin Supabase wrappers, colocated tests) to mirror for the new fetch/log functions
- `src/lib/supabase/database.types.ts` -- add `ContractAccessLog{Row,Insert,Update}` after the migration lands
- `src/lib/supabase/server.ts` -- `createClient()`, the session-bound client (RLS-enforced) to use for the storage download and the log insert — no service-role client needed here, same as Story 1

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/0006_contract_access_log.sql` -- create `contract_access_log` (`id` uuid pk, `contract_id` uuid FK `contracts.id`, `admin_id` uuid FK `admin_users.user_id`, `accessed_at` timestamptz default `now()`) + RLS (`app_current_role() = 'super_admin'` for select/insert; no update/delete needed — it's an append-only log) + index on `contract_id` -- schema foundation
- [x] `src/lib/contracts/fetch-contract.ts` -- `fetchContract(supabase, id): Promise<ContractRow | null>` -- single-row lookup by id, `null` on not-found (PostgREST "no rows" is not an error to surface)
- [x] `src/lib/contracts/decrypt-contract-file.ts` -- `decryptContractFile(buffer): Buffer` using `node:crypto` `createDecipheriv`, splitting `iv`/`authTag`/`ciphertext` per the layout in `encrypt-contract-file.ts`; lets the GCM auth-tag-verification failure propagate as a thrown error (do not swallow it)
- [x] `src/lib/contracts/log-contract-access.ts` -- `logContractAccess(supabase, contractId, adminId): Promise<void>` -- insert into `contract_access_log`; caller (the route) treats an insert failure as fail-open per Boundaries & Constraints
- [x] `src/app/painel-8f2k/contratos/[id]/download/route.ts` -- `GET`: `requireSuperAdmin` guard → `fetchContract` (404 if null or `file_object_path` null) → `supabase.storage.from('contracts').download(path)` → `decryptContractFile` (500 on failure, logged server-side, no log row) → `logContractAccess` (fail-open, catch+log any error) → `Response` with `Content-Type: application/pdf`, `Content-Disposition: attachment; filename="contrato-<id>.pdf"`
- [x] Colocated `.test.ts` for every file above, including every I/O Matrix row

**Acceptance Criteria:**
- Given a contract with a valid encrypted file and a super_admin caller, when the download route runs, then the response body's first bytes are `%PDF` and exactly one `contract_access_log` row exists for `(contract_id, admin_id)`.
- Given a contract with `file_object_path = null`, when the download route runs, then it responds 404 and no `contract_access_log` row is written.
- Given a non-super_admin caller, when the download route runs, then it responds 403 before any storage or `contracts` table read.

## Implementation Notes

Implemented as specified: migration `0006_contract_access_log.sql`, `fetch-contract.ts`, `decrypt-contract-file.ts`, `log-contract-access.ts`, and the `GET` Route Handler at `src/app/painel-8f2k/contratos/[id]/download/route.ts`. Added `ContractAccessLogRow/Insert/Update` to `database.types.ts` per the Code Map note. All colocated tests pass (17 new tests), full suite green (428/428), `tsc --noEmit` and `eslint` clean. Migration not applied to a live Supabase instance as part of this task (no DB access here) — apply via the project's normal migration flow before this route is exercised against real data.

## Spec Change Log

## Review Triage Log

Three layers (Blind Hunter, Edge Case Hunter, Verification Gap) reviewed the diff. All findings verified against actual code before routing.

- **medium — patch**: the 200 response never sets `Cache-Control: no-store` on the decrypted PDF bytes. The spec's own Boundaries & Constraints explicitly forbid caching the plaintext "anywhere (memory, disk, CDN, response cache headers)" — leaving the header unset relies entirely on this route happening to be dynamically rendered rather than declaring the constraint on the wire. Fix: add `Cache-Control: no-store, private` to the response headers.
- **medium — patch**: the `GET` handler has no outer `try`/`catch`, unlike the Route Handler the spec's own Code Map names as the shape to mirror (`src/app/api/leads/route.ts`, which wraps its whole body). `requireSuperAdmin` → `getCurrentAdmin()` can throw (e.g. the underlying Supabase auth call rejecting), which would surface as an unhandled rejection / Next.js default error page instead of this route's controlled, crypto-detail-safe response. Fix: wrap the handler body in `try`/`catch`, returning a generic 500 on any uncaught error, matching the mirrored precedent.
- **low — reject**: Edge Case Hunter also flagged `supabase.storage.from(BUCKET).download()` as a possible-throw call needing the same guard. Verified against `create-contract.ts` (Story 1, already reviewed): it destructures `{ error }` from `storage.upload()` with no surrounding `try`/`catch` either, and that was not flagged in the prior review — supabase-js's storage client is used throughout this codebase as resolving with `{data,error}` rather than throwing. Once the outer `try`/`catch` above is added (for the `requireSuperAdmin`/`getCurrentAdmin` path), it also incidentally covers this call, so no separate fix needed.
- **low — reject**: Content-Disposition header interpolates the raw `id` route param unsanitized. Verified: `fetchContract` 404s on any `id` that isn't a real contract row, and `id` only reaches the header after that lookup succeeds — a UUID pulled from the database, not attacker-controlled bytes. Not reachable as described.
- **false**: Blind Hunter flagged that a non-PDF file could be stored and then served with a hardcoded `Content-Type: application/pdf`/`.pdf` filename that "silently mislabels" it. Disproved: Story 1's `validateContractFile` (`src/app/painel-8f2k/contratos/actions.ts`) already rejects any upload that isn't `application/pdf` with a verified `%PDF` magic-byte signature before encryption — there is no path in this codebase that stores a non-PDF as a contract file.
- **low — reject**: `decryptContractFile` doesn't explicitly guard the input buffer's minimum length (28 bytes) before slicing. Verified: a too-short buffer still ends up thrown from `createDecipheriv`/`setAuthTag`/`decipher.final()` (invalid IV length or auth tag mismatch), which the route already catches and turns into the same generic 500 — the safety property (no crypto internals leaked, no crash) holds either way; an explicit length guard would only change an internal error message never shown to the client.
- **low — defer**: `contract_access_log.contract_id`'s FK to `contracts.id` has no `ON DELETE` behavior (defaults to blocking `NO ACTION`), so a contract can never be deleted once it has an access-log row. Same open class of issue as the pre-existing deferred item on `admin_users`/`leads`/`projects` FKs (see `deferred-work.md`) — no epic ships a delete flow for any of these entities yet, so there's no live trigger path, and the intended behavior (cascade vs. block) is a product decision, not a code guess.
- **low — reject**: no index on `contract_access_log.admin_id`. Out of scope for this deliverable (no query filters by `admin_id` yet) — the still-deferred listing/history story is the natural place to decide what indexes it actually needs.
- **low — reject**: no test for a malformed (non-UUID) `id` path. Verified: it still produces a 404 (Postgres error → `fetchContract` returns `null` → route 404s) — same observable outcome as "not found," so there's no user-visible or security-relevant gap, just an untested-but-already-correct branch.
- **low — reject**: RLS policies added in the migration aren't exercised by any test. Consistent with this entire codebase's established testing convention (no story in Epics 1–5 has live-Supabase/RLS integration tests either) — not a regression introduced by this diff.
