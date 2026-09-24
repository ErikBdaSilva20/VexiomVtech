-- Story 2.3: allow authenticated super_admin/employer admins to insert into
-- `leads` directly (manual lead entry), matching the pattern already used
-- for lead_interactions/lead_meetings insert policies.
drop policy if exists "leads_insert_admins" on public.leads;
create policy "leads_insert_admins"
  on public.leads for insert
  with check (app_current_role() in ('super_admin', 'employer'));
