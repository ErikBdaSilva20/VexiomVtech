-- GENERATED FILE — do not hand-edit.
-- Produced by scripts/generate-supabase-migrations.mjs from every file in
-- supabase/migrations/, concatenated in filename order. Paste this whole
-- file into the Supabase SQL editor to apply all migrations in one shot.
-- To change the schema, add a new numbered file under supabase/migrations/
-- and re-run `pnpm db:migrations`.

-- ---------------------------------------------------------------------------
-- Source: supabase/migrations/0001_initial_schema.sql
-- ---------------------------------------------------------------------------

-- Vexiom — full base schema for a fresh Supabase project.
--
-- Hand-maintained. Run once against a fresh Supabase project (SQL Editor,
-- or `psql` against the project's connection string). Going forward, do NOT
-- edit this file for incremental changes — add a new numbered file under
-- `supabase/migrations/` instead (see supabase/migrations/README convention
-- described in the Epic 1 spec). This file and migration 0001 are kept in
-- sync by hand for the initial schema only.
--
-- Source of truth: docs/plans/08-integracao-supabase-e-area-administrativa.md
-- (schema: lines 23-163; RLS: lines 151-164).

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tables (created in dependency order)
-- ---------------------------------------------------------------------------

-- admin_users: associates an auth.users row with an application role. This is
-- the source of truth for permissions inside the app — Supabase Auth alone
-- has no concept of role. super_admin and employer rows are created manually
-- via SQL/dashboard by the two founders; there is no public sign-up screen.
create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('super_admin', 'employer')),
  name text,
  created_at timestamptz not null default now()
);

-- leads: captação pública (via POST /api/leads, service role) e cadastro
-- manual pelo admin. project_type/status/source são taxonomias fechadas na
-- documentação de produto (docs 05/06), mas sem CHECK rígido no banco —
-- doc 08 só marca CHECK explícito nos campos abaixo listados.
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  company text,
  email text not null,
  whatsapp text not null,
  project_type text not null,
  description text not null,
  desired_deadline text,
  budget_range text,
  preferred_channel text,
  preferred_time text,
  status text not null default 'novo_lead',
  assigned_to uuid references public.admin_users (user_id),
  viewed_at timestamptz,
  responded_at timestamptz,
  next_action text,
  next_action_at timestamptz,
  probability text check (probability in ('baixa', 'media', 'alta')),
  tags text[],
  non_conversion_reason text,
  source text not null default 'site',
  created_by uuid references public.admin_users (user_id),
  possible_duplicate_of uuid references public.leads (id),
  last_interaction_at timestamptz
);

-- lead_interactions: linha do tempo única por lead (mensagens, notas,
-- mudanças de status). Substitui uma tabela lead_notes separada.
create table public.lead_interactions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  author_id uuid references public.admin_users (user_id),
  type text not null check (
    type in ('nota', 'mensagem_enviada', 'mensagem_recebida', 'mudanca_status')
  ),
  content text not null,
  occurred_at timestamptz not null default now()
);

-- lead_meetings: um lead pode ter mais de uma reunião ao longo da negociação.
create table public.lead_meetings (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  scheduled_at timestamptz not null,
  status text not null default 'agendada' check (
    status in ('agendada', 'realizada', 'cancelada')
  ),
  notes text,
  created_at timestamptz default now()
);

-- projects: qualquer trabalho contratado, publicado como case ou não.
-- Existe pra que o financeiro rastreie lucro por projeto mesmo sem case.
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  client_name text,
  lead_id uuid references public.leads (id),
  status text not null default 'em_andamento' check (
    status in ('em_andamento', 'concluido', 'cancelado')
  ),
  started_at date,
  finished_at date,
  created_at timestamptz default now()
);

-- cases: portfólio público dinâmico. Campos definidos pelo negócio.
create table public.cases (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  category text not null,
  client_name text,
  is_founder_project boolean not null default false,
  project_id uuid references public.projects (id),
  cover_image_url text,
  gallery_urls text[],
  external_link text,
  description text not null,
  tech_stack text[],
  problem_solved text not null,
  motivation text not null,
  published boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- financial_transactions: livro-caixa único da Vexiom. partner_id preenchido
-- = lançamento financiado pessoalmente por um sócio (aporte/investimento);
-- vazio = movimento normal do caixa da empresa.
create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('entrada', 'saida')),
  category text not null,
  amount numeric(12, 2) not null check (amount > 0),
  occurred_at date not null default current_date,
  description text not null,
  project_id uuid references public.projects (id),
  partner_id uuid references public.admin_users (user_id),
  created_by uuid not null references public.admin_users (user_id),
  created_at timestamptz default now()
);

-- ---------------------------------------------------------------------------
-- app_current_role(): SECURITY DEFINER helper used inside RLS policies of other
-- tables. Reading admin_users directly inside a policy on admin_users itself
-- would recurse; this function reads it once, as the function owner, and is
-- called from other tables' policies instead.
-- ---------------------------------------------------------------------------

create or replace function public.app_current_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.admin_users where user_id = auth.uid();
$$;

-- ---------------------------------------------------------------------------
-- Triggers ("Notas de implementação para Amelia", doc 08)
-- ---------------------------------------------------------------------------

-- Trigger de mudança de status: AFTER UPDATE ON leads WHEN status muda,
-- insere automaticamente uma linha mudanca_status em lead_interactions.
-- Fica no banco (não no código da aplicação) pra funcionar mesmo se o status
-- for alterado por outro caminho no futuro.
create or replace function public.log_lead_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.lead_interactions (lead_id, author_id, type, content, occurred_at)
  values (
    new.id,
    null,
    'mudanca_status',
    format('Status alterado de %s para %s', old.status, new.status),
    now()
  );
  return new;
end;
$$;

create trigger trg_leads_log_status_change
  after update on public.leads
  for each row
  when (old.status is distinct from new.status)
  execute function public.log_lead_status_change();

-- Manutenção de last_interaction_at: AFTER INSERT ON lead_interactions
-- atualiza leads.last_interaction_at. Evita agregar (MAX) a tabela de
-- interações toda vez que o painel carrega.
create or replace function public.set_lead_last_interaction_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.leads
  set last_interaction_at = new.occurred_at
  where id = new.lead_id;
  return new;
end;
$$;

create trigger trg_lead_interactions_set_last_interaction_at
  after insert on public.lead_interactions
  for each row
  execute function public.set_lead_last_interaction_at();

-- ---------------------------------------------------------------------------
-- Row Level Security ("Segurança (RLS)", doc 08 lines 151-164)
-- ---------------------------------------------------------------------------

-- admin_users: RLS habilitado; cada usuário só lê a própria linha. Suficiente
-- para a aplicação descobrir o papel do usuário logado. Sem policy de
-- insert/update/delete — essas linhas são geridas manualmente pelos
-- founders via SQL/dashboard (role postgres/service role, que ignora RLS).
alter table public.admin_users enable row level security;

create policy "admin_users_select_own"
  on public.admin_users for select
  using (auth.uid() = user_id);

-- leads: sem policy de insert para anon — a escrita pública acontece só via
-- POST /api/leads (Route Handler) com a service role key, nunca exposta ao
-- navegador. select/update liberado para super_admin e employer; delete só
-- super_admin.
alter table public.leads enable row level security;

create policy "leads_select_admins"
  on public.leads for select
  using (app_current_role() in ('super_admin', 'employer'));

create policy "leads_update_admins"
  on public.leads for update
  using (app_current_role() in ('super_admin', 'employer'));

create policy "leads_delete_super_admin"
  on public.leads for delete
  using (app_current_role() = 'super_admin');

-- lead_interactions e lead_meetings: mesma regra de leads para
-- select/insert/update; delete só super_admin.
alter table public.lead_interactions enable row level security;

create policy "lead_interactions_select_admins"
  on public.lead_interactions for select
  using (app_current_role() in ('super_admin', 'employer'));

create policy "lead_interactions_insert_admins"
  on public.lead_interactions for insert
  with check (app_current_role() in ('super_admin', 'employer'));

create policy "lead_interactions_update_admins"
  on public.lead_interactions for update
  using (app_current_role() in ('super_admin', 'employer'));

create policy "lead_interactions_delete_super_admin"
  on public.lead_interactions for delete
  using (app_current_role() = 'super_admin');

alter table public.lead_meetings enable row level security;

create policy "lead_meetings_select_admins"
  on public.lead_meetings for select
  using (app_current_role() in ('super_admin', 'employer'));

create policy "lead_meetings_insert_admins"
  on public.lead_meetings for insert
  with check (app_current_role() in ('super_admin', 'employer'));

create policy "lead_meetings_update_admins"
  on public.lead_meetings for update
  using (app_current_role() in ('super_admin', 'employer'));

create policy "lead_meetings_delete_super_admin"
  on public.lead_meetings for delete
  using (app_current_role() = 'super_admin');

-- cases: select liberado para todos quando published = true (alimenta a
-- página pública /cases), e também para super_admin ver rascunhos.
-- insert/update/delete só super_admin.
alter table public.cases enable row level security;

create policy "cases_select_published_or_super_admin"
  on public.cases for select
  using (published = true or app_current_role() = 'super_admin');

create policy "cases_insert_super_admin"
  on public.cases for insert
  with check (app_current_role() = 'super_admin');

create policy "cases_update_super_admin"
  on public.cases for update
  using (app_current_role() = 'super_admin');

create policy "cases_delete_super_admin"
  on public.cases for delete
  using (app_current_role() = 'super_admin');

-- projects e financial_transactions: acesso total restrito a super_admin. O
-- employer não enxerga nada dessas tabelas, nem em modo leitura.
alter table public.projects enable row level security;

create policy "projects_all_super_admin"
  on public.projects for all
  using (app_current_role() = 'super_admin')
  with check (app_current_role() = 'super_admin');

alter table public.financial_transactions enable row level security;

create policy "financial_transactions_all_super_admin"
  on public.financial_transactions for all
  using (app_current_role() = 'super_admin')
  with check (app_current_role() = 'super_admin');

-- ---------------------------------------------------------------------------
-- Storage: bucket case-images (doc 08, line 162) — leitura pública, escrita
-- restrita a super_admin.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('case-images', 'case-images', true)
on conflict (id) do nothing;

create policy "case_images_public_read"
  on storage.objects for select
  using (bucket_id = 'case-images');

create policy "case_images_super_admin_write"
  on storage.objects for insert
  with check (bucket_id = 'case-images' and app_current_role() = 'super_admin');

create policy "case_images_super_admin_update"
  on storage.objects for update
  using (bucket_id = 'case-images' and app_current_role() = 'super_admin');

create policy "case_images_super_admin_delete"
  on storage.objects for delete
  using (bucket_id = 'case-images' and app_current_role() = 'super_admin');
