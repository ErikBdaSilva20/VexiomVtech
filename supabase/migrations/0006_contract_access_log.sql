-- contract_access_log: registro append-only de quem abriu o arquivo
-- decriptado de um contrato e quando — auditoria exigida antes de expor o
-- botão de download (ver spec-contratos-download-e-log-de-acesso.md).
--
-- Sem update/delete: é um log de acesso, não um registro editável.

create table if not exists public.contract_access_log (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts (id),
  admin_id uuid not null references public.admin_users (user_id),
  accessed_at timestamptz not null default now()
);

create index if not exists contract_access_log_contract_id_idx on public.contract_access_log (contract_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — restrito a super_admin, somente select/insert.
-- ---------------------------------------------------------------------------

alter table public.contract_access_log enable row level security;

drop policy if exists "contract_access_log_select_super_admin" on public.contract_access_log;
create policy "contract_access_log_select_super_admin"
  on public.contract_access_log for select
  using (app_current_role() = 'super_admin');

drop policy if exists "contract_access_log_insert_super_admin" on public.contract_access_log;
create policy "contract_access_log_insert_super_admin"
  on public.contract_access_log for insert
  with check (app_current_role() = 'super_admin');
