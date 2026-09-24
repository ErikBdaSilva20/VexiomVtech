-- Story 2.7: `leads.status` has no enum/check constraint today — the
-- app-level Zod validation (FR12 AC3) is currently the only thing stopping
-- an invalid status from being written. This adds a DB-level backstop so
-- no future write path (a script, another service, a manual SQL edit) can
-- bypass it, matching the pattern already used for `lead_meetings.status`
-- and `projects.status`.
--
-- Uses drop-then-create (no `ADD CONSTRAINT IF NOT EXISTS` in Postgres) so
-- this file stays safe to run more than once, consistent with the rest of
-- this project's migration style.
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads add constraint leads_status_check check (
  status in (
    'novo_lead',
    'em_analise',
    'primeiro_contato_realizado',
    'conversa_agendada',
    'proposta_em_preparacao',
    'proposta_enviada',
    'follow_up_pendente',
    'contrato_fechado',
    'nao_convertido',
    'em_suporte_continuo'
  )
);
