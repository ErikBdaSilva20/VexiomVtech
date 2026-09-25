-- Vexiom — massive test data for dashboard scale testing (dev/staging only).
--
-- Purpose: populate every table with 100+ rows spread over the last ~18
-- months so the "Visão geral" dashboard (leads/prospecting, financeiro,
-- contratos) can be visually checked under realistic volume — many months
-- of history, large KPI numbers, long bar-chart category lists, etc.
--
-- NOT part of the migrations/setup.sql schema files. Run this by hand
-- against a dev/staging Supabase project only — never against production.
--
-- Requires at least one row in public.admin_users already (create your
-- super_admin/employer test accounts first). Rows are distributed round-robin
-- across whatever admins already exist.
--
-- Idempotent-ish: every seeded row is tagged so this script can be re-run
-- (it deletes its own previous output first) or fully removed later — see
-- the cleanup-only block commented out at the bottom of this file.

begin;

-- ---------------------------------------------------------------------------
-- 0. Guard + cleanup previous runs (children first, respecting FKs)
-- ---------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from public.admin_users) then
    raise exception 'No rows in public.admin_users — create at least one admin (super_admin or employer) before running this seed.';
  end if;
end $$;

delete from public.contract_access_log
where contract_id in (
  select c.id from public.contracts c
  join public.leads l on l.id = c.lead_id
  where l.email like 'seed-dash-%@teste.local'
);

delete from public.contracts
where lead_id in (select id from public.leads where email like 'seed-dash-%@teste.local');

delete from public.lead_meetings
where lead_id in (select id from public.leads where email like 'seed-dash-%@teste.local');

delete from public.lead_interactions
where lead_id in (select id from public.leads where email like 'seed-dash-%@teste.local');

delete from public.cases
where slug like 'seed-dash-%';

delete from public.financial_transactions
where description like 'SEED-DASH:%';

delete from public.projects
where title like 'SEED-DASH:%';

delete from public.leads
where email like 'seed-dash-%@teste.local';

-- ---------------------------------------------------------------------------
-- 1. Leads — 160 rows, statuses/project types/sources spread evenly,
--    created_at spread over the last 18 months.
-- ---------------------------------------------------------------------------

insert into public.leads (
  name, company, email, whatsapp, project_type, description, desired_deadline,
  budget_range, preferred_channel, preferred_time, status, assigned_to,
  viewed_at, responded_at, probability, source, created_by, created_at
)
select
  'Lead Teste ' || i,
  case when i % 3 = 0 then 'Empresa ' || i || ' Ltda' else null end,
  'seed-dash-' || i || '@teste.local',
  '55119' || lpad((10000000 + i)::text, 8, '0'),
  (array['site', 'sistema_sob_medida', 'aplicativo', 'manutencao', 'consultoria'])[1 + (i % 5)],
  'Descrição de teste gerada automaticamente para o lead ' || i || ' — dado sintético de escala.',
  (array['1 mês', '2 meses', '3 meses', null])[1 + (i % 4)],
  (array['5-10k', '10-30k', '30-60k', '60k+'])[1 + (i % 4)],
  (array['whatsapp', 'email', 'telefone'])[1 + (i % 3)],
  (array['manha', 'tarde', 'noite'])[1 + (i % 3)],
  (array['novo_lead', 'em_analise', 'primeiro_contato_realizado', 'conversa_agendada',
         'proposta_em_preparacao', 'proposta_enviada', 'follow_up_pendente',
         'contrato_fechado', 'nao_convertido', 'em_suporte_continuo'])[1 + (i % 10)],
  (select user_id from public.admin_users order by user_id offset (i % (select count(*) from public.admin_users)) limit 1),
  case when i % 2 = 0 then now() - (random() * interval '400 days') else null end,
  case when i % 4 = 0 then now() - (random() * interval '380 days') else null end,
  (array['baixa', 'media', 'alta', null])[1 + (i % 4)],
  (array['site', 'indicacao', 'instagram', 'google'])[1 + (i % 4)],
  (select user_id from public.admin_users order by user_id offset (i % (select count(*) from public.admin_users)) limit 1),
  now() - (random() * interval '540 days')
from generate_series(1, 160) as i;

-- ---------------------------------------------------------------------------
-- 2. Lead interactions — ~2.5 per seeded lead.
-- ---------------------------------------------------------------------------

insert into public.lead_interactions (lead_id, author_id, type, content, occurred_at)
select
  l.id,
  (select user_id from public.admin_users order by user_id offset (abs(hashtext(l.id::text || n::text)) % (select count(*) from public.admin_users)) limit 1),
  (array['nota', 'mensagem_enviada', 'mensagem_recebida'])[1 + (abs(hashtext(l.id::text || n::text || 't')) % 3)],
  'Interação de teste #' || n || ' gerada automaticamente para o lead ' || l.email || '.',
  l.created_at + (random() * interval '30 days')
from public.leads l
cross join generate_series(1, 3) as n
where l.email like 'seed-dash-%@teste.local'
  and (n < 3 or abs(hashtext(l.id::text)) % 2 = 0); -- ~2.5 rows/lead on average

-- ---------------------------------------------------------------------------
-- 3. Lead meetings — for about a third of the seeded leads.
-- ---------------------------------------------------------------------------

insert into public.lead_meetings (lead_id, scheduled_at, status, notes)
select
  l.id,
  l.created_at + (random() * interval '45 days'),
  (array['agendada', 'realizada', 'cancelada'])[1 + (abs(hashtext(l.id::text || 'm')) % 3)],
  'Reunião de teste gerada automaticamente.'
from public.leads l
where l.email like 'seed-dash-%@teste.local'
  and abs(hashtext(l.id::text || 'meet')) % 3 = 0;

-- ---------------------------------------------------------------------------
-- 4. Projects — 70 rows, about half linked to a seeded lead.
-- ---------------------------------------------------------------------------

insert into public.projects (title, client_name, lead_id, status, started_at, finished_at, created_at)
select
  'SEED-DASH: Projeto ' || i,
  'Cliente Teste ' || i,
  case
    when i % 2 = 0 then (
      select id from public.leads
      where email like 'seed-dash-%@teste.local'
      order by id offset (i % 160) limit 1
    )
    else null
  end,
  (array['em_andamento', 'concluido', 'cancelado'])[1 + (i % 3)],
  (current_date - ((random() * 540)::int)),
  case when i % 3 = 0 then current_date - ((random() * 60)::int) else null end,
  now() - (random() * interval '500 days')
from generate_series(1, 70) as i;

-- ---------------------------------------------------------------------------
-- 5. Cases — 35 rows, linked to a subset of the seeded projects, mixed
--    published/draft.
-- ---------------------------------------------------------------------------

insert into public.cases (
  slug, title, category, client_name, is_founder_project, project_id,
  description, tech_stack, problem_solved, motivation, published, display_order, created_at
)
select
  'seed-dash-case-' || i,
  'Case de Teste ' || i,
  (array['site', 'sistema', 'aplicativo', 'consultoria'])[1 + (i % 4)],
  'Cliente Teste ' || i,
  i % 10 = 0,
  (select id from public.projects where title like 'SEED-DASH:%' order by id offset (i % 70) limit 1),
  'Descrição de case sintético gerado para teste de escala #' || i || '.',
  array['Next.js', 'Supabase', 'Tailwind'],
  'Problema fictício resolvido no case de teste ' || i || '.',
  'Motivação fictícia registrada para o case de teste ' || i || '.',
  i % 3 != 0,
  i,
  now() - (random() * interval '480 days')
from generate_series(1, 35) as i;

-- ---------------------------------------------------------------------------
-- 6. Financial transactions — 240 rows (entrada/saída mixed), spread over
--    the last 18 months, about a third linked to a seeded project/partner.
-- ---------------------------------------------------------------------------

insert into public.financial_transactions (
  direction, category, amount, occurred_at, description, project_id, partner_id, created_by, created_at
)
select
  case when i % 3 = 0 then 'saida' else 'entrada' end,
  case
    when i % 3 = 0 then (array['infraestrutura', 'ferramentas', 'marketing', 'impostos', 'folha'])[1 + (i % 5)]
    else (array['projeto_fechado', 'consultoria', 'manutencao', 'aporte_socio'])[1 + (i % 4)]
  end,
  round((100 + random() * 14900)::numeric, 2),
  (current_date - ((random() * 540)::int)),
  'SEED-DASH: lançamento sintético #' || i,
  case when i % 3 = 0 then (select id from public.projects where title like 'SEED-DASH:%' order by id offset (i % 70) limit 1) else null end,
  case when i % 9 = 0 then (select user_id from public.admin_users order by user_id offset (i % (select count(*) from public.admin_users)) limit 1) else null end,
  (select user_id from public.admin_users order by user_id offset (i % (select count(*) from public.admin_users)) limit 1),
  now() - (random() * interval '500 days')
from generate_series(1, 240) as i;

-- ---------------------------------------------------------------------------
-- 7. Contracts — 140 rows linked to seeded leads. Roughly a quarter include
--    "demanda" (hourly) with hours set, matching the app-level rule.
-- ---------------------------------------------------------------------------

insert into public.contracts (lead_id, service_types, amount, hours, created_by, created_at)
select
  (select id from public.leads where email like 'seed-dash-%@teste.local' order by id offset (i % 160) limit 1),
  case
    when i % 4 = 0 then array['demanda']
    when i % 4 = 1 then array['site', 'manutencao']
    when i % 4 = 2 then array['sistema_sob_medida']
    else array['aplicativo', 'consultoria']
  end,
  round((800 + random() * 49200)::numeric, 2),
  case when i % 4 = 0 then round((10 + random() * 190)::numeric, 2) else null end,
  (select user_id from public.admin_users order by user_id offset (i % (select count(*) from public.admin_users)) limit 1),
  now() - (random() * interval '480 days')
from generate_series(1, 140) as i;

-- ---------------------------------------------------------------------------
-- 8. Contract access log — 90 rows referencing seeded contracts.
-- ---------------------------------------------------------------------------

insert into public.contract_access_log (contract_id, admin_id, accessed_at)
select
  c.id,
  (select user_id from public.admin_users order by user_id offset (abs(hashtext(c.id::text)) % (select count(*) from public.admin_users)) limit 1),
  c.created_at + (random() * interval '60 days')
from public.contracts c
join public.leads l on l.id = c.lead_id
where l.email like 'seed-dash-%@teste.local'
order by c.id
limit 90;

commit;

-- ---------------------------------------------------------------------------
-- To remove all seeded data later, run the DELETE block in section 0 above
-- on its own (everything from "delete from public.contract_access_log"
-- through "delete from public.leads"), wrapped in its own BEGIN/COMMIT.
-- ---------------------------------------------------------------------------
