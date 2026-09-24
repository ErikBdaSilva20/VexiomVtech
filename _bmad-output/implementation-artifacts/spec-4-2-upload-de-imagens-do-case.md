---
title: 'Story 4.2: Upload de imagens do case (backend)'
type: 'feature'
created: '2026-09-24'
status: 'done'
review_loop_iteration: 0
context: []
baseline_commit: '18cee6f'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** FR28/4.2 needs cover + gallery image upload for a case, into the existing `case-images` Storage bucket (RLS-protected, `super_admin`-only write, already set up in Epic 1). `case-editor.tsx`'s form already has `cover_image` (single file) and `gallery_images` (multiple file) inputs, disabled pending this backend.

**Approach:** `uploadCaseImage(supabase, caseId, file)` validates and uploads one file, returning its public URL. `setCaseCoverImage`/`appendCaseGalleryImages` persist the URL(s) onto the `cases` row — gallery URLs are additive (read-then-append), matching the AC's "as URLs são adicionadas a `gallery_urls`" wording. Both `createCaseAction` and `updateCaseAction` (4.1) now call a shared `applyCaseImages` helper after their field save succeeds, so image handling is available on both the "new case" and "edit case" flows without duplicating the FormData-parsing logic.

**Design decision — images are best-effort, not part of the field-save transaction:** by the time `applyCaseImages` runs, `createCase`/`updateCase` has already committed. An image upload failure (bad format, oversized file, storage hiccup) is surfaced back as `imageErrors` on the same `CreateCaseState`/`UpdateCaseState` the field save already returned as `"success"` — it never turns a successful case save into an error, since the case row is real and the admin can just retry the image from the edit page afterward.

## Boundaries & Constraints

**Always:**
- Uploaded object names are always a random UUID + extension derived from the *validated* MIME type — never the client-supplied filename (avoids path traversal / overwrite-by-filename-collision).
- Only `image/png`, `image/jpeg`, `image/webp` are accepted; max 5MB per file.
- Gallery uploads are additive — existing `gallery_urls` are preserved, new ones appended, never replaced.
- The session-aware Supabase client is used for the Storage upload (never a service-role client) — Storage RLS (`case_images_super_admin_write`) is the real enforcement layer, same defense-in-depth posture as the `cases` table RLS in 4.1.

**Never:**
- No cover/gallery URL removal or reordering in this story — not in the AC.
- No blocking of the field save when an image upload fails.
- No page/component changes — wiring these actions' `cover_image`/`gallery_images` FormData fields into the existing (already-correctly-named) form inputs is Codex's follow-up.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid cover image on create | PNG/JPG/WebP ≤5MB | Uploaded, `cover_image_url` set | N/A |
| Valid gallery images on update | 1+ files | Uploaded, URLs appended to existing `gallery_urls` | N/A |
| No file selected (empty `File`, size 0) | — | Skipped entirely, no upload attempted | N/A |
| Oversized or wrong-format file | — | Case/field save still succeeds; `imageErrors.cover_image`/`gallery_images` reports the specific reason | Logged server-side only for actual storage failures, not validation rejections |
| Storage upload fails (bucket/network) | — | Same as above — `imageErrors`, case save unaffected | Logged server-side |
| Non-`super_admin` caller | — | Rejected before any DB/Storage call (same `requireSuperAdmin` gate as 4.1) | N/A |

</frozen-after-approval>

## Code Map

- `src/lib/leads/mark-lead-viewed.ts` -- the one other place in this codebase that deliberately treats a failure as non-fatal rather than throwing; same reasoning style applied to `applyCaseImages`.
- `src/app/painel-8f2k/cases/actions.ts` (4.1) -- `createCaseAction`/`updateCaseAction` extended with the shared `applyCaseImages` call; `requireSuperAdmin`/`textFormValue`/error-shape conventions reused as-is.
- `supabase/setup.sql` (lines 350-376) -- `case-images` bucket + RLS, reused as-is, no migration needed.

## Tasks & Acceptance

**Execution:**
- [x] `src/lib/cases/case-image-upload.ts` -- new `uploadCaseImage(supabase, caseId, file)`
- [x] `src/lib/cases/set-case-images.ts` -- new `setCaseCoverImage`, `appendCaseGalleryImages`
- [x] `src/app/painel-8f2k/cases/actions.ts` -- `applyCaseImages` wired into both actions
- [x] Tests for all new/changed modules

**Acceptance Criteria:** see I/O matrix above (mirrors FR28 ACs verbatim; the "rejected by Storage policy" AC is enforced by the existing bucket RLS itself, exercised indirectly by using the session-aware client rather than a privileged one).

## Implementation Notes

- Implemented directly, self-reviewed inline (no subagent dispatch), per standing token-conservation instruction.
- 5MB per-file cap is a judgment call (not specified in the AC/docs) — reasonable for a portfolio screenshot; revisit if real usage needs larger source files.
- `pnpm tsc --noEmit`, `pnpm lint`, `pnpm test` (249 tests) all pass.
- Not verified against a live Supabase Storage bucket — no CLI/DB access in this environment.
- **Post-hoc audit fix (2026-09-24):** the initial version trusted the client-supplied `File.type` alone for both the format gate and the stored extension — a spoofed `type` (e.g. HTML declared as `image/png`) would have been written to the *public* `case-images` bucket with that same Content-Type. Added a magic-byte check (`matchesDeclaredType`) so the declared MIME type must match the file's real signature. Also fixed `external_link` in `case-schema.ts` having no max length, unlike every other free-text field.
- This closes the backend for Epic 4's first two stories. Story 4.3 (public `/cases` page) is a read-only page — Codex has already built it against direct Supabase queries (RLS-protected `cases_select_published_or_super_admin`), so it needs no additional backend work; flagging this to the user rather than assuming.

## Verification

**Commands:**
- `pnpm lint` -- no errors
- `pnpm tsc --noEmit` -- no type errors
- `pnpm test` -- 249 tests pass, including new coverage for `case-image-upload.ts`, `set-case-images.ts`, and the image-handling paths in `actions.ts`
