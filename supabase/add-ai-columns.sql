-- AI lead classification — run once if you already created the leads table
-- before adding the bonus feature. Safe to re-run.
alter table public.leads add column if not exists category text;
alter table public.leads add column if not exists priority text;
