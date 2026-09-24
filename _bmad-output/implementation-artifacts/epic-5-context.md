# Epic 5 Context: Projetos Internos e Financeiro

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Give `super_admin` a way to track every contracted piece of work as an internal `project` (whether or not it is published as a public case) and a single cash-book (`financial_transactions`) for every entrada/saida that passes through Vexiom. The financial dashboard surfaces balance, charts, and per-project profit built from that one table.

## Stories

- Story 5.1: Cadastro de projetos internos
- Story 5.2: Registro de lançamentos financeiros
- Story 5.3: Saldo financeiro do período
- Story 5.4: Gráficos do dashboard financeiro
- Story 5.5: Lucro por projeto

## Requirements & Constraints

- `employer` role must have zero access — not even read — to `projects` and `financial_transactions` (same rule already enforced for `cases`).
- Financial writes are `super_admin`-only; there is no public/anonymous access path for this epic.
- All financial write payloads must be validated before persistence (same discipline as the leads/cases Zod schemas already in the codebase).
- Charts in the financial dashboard must follow the `dataviz` skill for palette/accessibility before any chart code is written (frontend concern, but shapes what the backend needs to return: e.g. amounts grouped by month/category/partner).
- Expense vs. investment are not separate categories: a single optional `partner_id` on a transaction distinguishes a partner-funded entry (personal contribution) from a normal company cash movement. Empty `partner_id` = normal movement, no special treatment.
- `category` is free text with a suggested list in the UI, no DB check constraint — intentional, low-risk given only 2 people enter data.

## Technical Decisions

### `projects` table (internal, not public)
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, pk | |
| `title` | text, not null | |
| `client_name` | text | nullable |
| `lead_id` | uuid | nullable, fk → `leads.id` |
| `status` | text, not null | default `em_andamento`; check `in ('em_andamento', 'concluido', 'cancelado')` |
| `started_at` / `finished_at` | date | nullable |
| `created_at` | timestamptz, default `now()` |

### `financial_transactions` table
| Column | Type | Notes |
|---|---|---|
| `id` | uuid, pk | |
| `direction` | text, not null | check `in ('entrada', 'saida')` |
| `category` | text, not null | free text, no DB check |
| `amount` | numeric(12,2), not null | check `amount > 0` |
| `occurred_at` | date, not null | default `current_date` |
| `description` | text, not null | |
| `project_id` | uuid | nullable, fk → `projects.id` |
| `partner_id` | uuid | nullable, fk → `admin_users.user_id` |
| `created_by` | uuid, not null | fk → `admin_users.user_id` |
| `created_at` | timestamptz, default `now()` |

### `cases.project_id` (added by this epic, per FR31)
- `cases` gets a nullable `project_id uuid fk → projects.id`, letting a super_admin link a published case back to the internal project representing the same work. Column belongs on `cases`, migration lives in this epic since `projects` doesn't exist before it.

### RLS
- `projects` and `financial_transactions`: full access (`select`/`insert`/`update`/`delete`) restricted to `app_current_role() = 'super_admin'`. Applied via the existing `app_current_role()` `SECURITY DEFINER` function (avoids RLS recursion) — same pattern as `cases`/`leads`.
- No anon policies at all on these two tables.

### Established codebase conventions (Epic 2/4 precedent — follow, don't reinvent)
- Domain logic lives in `src/lib/<domain>/` (see `src/lib/cases/`, `src/lib/leads/`): a Zod schema file, one file per server action (`create-*.ts`, `update-*.ts`), typed error helpers (`write-*-error.ts` pattern in `src/lib/cases/write-case-error.ts`).
- Each server action ships with a colocated `*.test.ts`.
- Migrations live in `supabase/migrations/` (idempotent), mirrored into `supabase/setup.sql`.
- Role/session checks reuse the existing `get-current-admin.ts` helper and `app_current_role()` DB function — don't hand-roll new auth checks.

## Cross-Story Dependencies

- 5.1 (`projects`) must land before 5.2 (`financial_transactions.project_id` fk) and before the `cases.project_id` link.
- 5.3, 5.4, 5.5 all read from `financial_transactions` populated by 5.2 — no new tables, just query/aggregation logic on top.
- Story ordering in this epic is strictly sequential: 5.1 → 5.2 → 5.3 → 5.4 → 5.5.
