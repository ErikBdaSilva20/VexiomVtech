-- contracts: registro de contrato fechado com um lead — tipo(s) de serviço,
-- valor, horas (obrigatórias quando algum serviço é "demanda") e,
-- opcionalmente, o caminho do anexo (PDF assinado) encriptado no bucket
-- privado `contracts`. Metadados ficam em claro, protegidos só por RLS —
-- somente o arquivo anexado é encriptado (AES-256-GCM, aplicação).
--
-- Backend-only nesta história: sem endpoint de download/decriptação e sem
-- listagem/histórico aqui (ver deferred-work.md).

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id),
  service_types text[] not null constraint contracts_service_types_valid check (
    array_length(service_types, 1) > 0
    and service_types <@ array['site', 'sistema_sob_medida', 'aplicativo', 'manutencao', 'consultoria', 'demanda']::text[]
  ),
  amount numeric(12, 2) not null constraint contracts_amount_positive check (amount > 0),
  hours numeric(8, 2) constraint contracts_hours_positive check (hours is null or hours > 0),
  file_object_path text,
  created_by uuid not null references public.admin_users (user_id),
  created_at timestamptz not null default now()
);

create index if not exists contracts_lead_id_idx on public.contracts (lead_id);
create index if not exists contracts_created_by_idx on public.contracts (created_by);

-- ---------------------------------------------------------------------------
-- Row Level Security — restrito a super_admin (todas as operações).
-- ---------------------------------------------------------------------------

alter table public.contracts enable row level security;

drop policy if exists "contracts_all_super_admin" on public.contracts;
create policy "contracts_all_super_admin"
  on public.contracts for all
  using (app_current_role() = 'super_admin')
  with check (app_current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Storage: bucket privado `contracts` — nenhuma leitura/escrita pública.
-- O conteúdo já chega encriptado application-side; o bucket nunca guarda
-- texto plano. Só super_admin lê/escreve, via cliente com sessão (RLS é a
-- camada real de enforcement).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('contracts', 'contracts', false)
on conflict (id) do nothing;

drop policy if exists "contracts_super_admin_read" on storage.objects;
create policy "contracts_super_admin_read"
  on storage.objects for select
  using (bucket_id = 'contracts' and app_current_role() = 'super_admin');

drop policy if exists "contracts_super_admin_write" on storage.objects;
create policy "contracts_super_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'contracts' and app_current_role() = 'super_admin');

drop policy if exists "contracts_super_admin_update" on storage.objects;
create policy "contracts_super_admin_update"
  on storage.objects for update
  using (bucket_id = 'contracts' and app_current_role() = 'super_admin');

drop policy if exists "contracts_super_admin_delete" on storage.objects;
create policy "contracts_super_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'contracts' and app_current_role() = 'super_admin');
