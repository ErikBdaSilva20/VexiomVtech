-- Story 4.1: `cases.updated_at` defaults to `now()` on insert but nothing
-- refreshes it on UPDATE — the admin cases list surfaces this column, so a
-- stale value would silently mislead whoever's checking what changed
-- recently. Auto-touch it in the DB (not application code) so it stays
-- correct no matter which future write path updates a case.
create or replace function public.set_cases_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cases_set_updated_at on public.cases;
create trigger trg_cases_set_updated_at
  before update on public.cases
  for each row
  execute function public.set_cases_updated_at();
