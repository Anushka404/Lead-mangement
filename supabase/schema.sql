-- Lead Management & Email Tracking — Supabase schema
-- Paste into Supabase SQL editor and run once.

create extension if not exists "pgcrypto";

-- Leads captured from the public form.
create table if not exists public.leads (
  id          uuid primary key default gen_random_uuid(),
  full_name   text        not null,
  email       text        not null,
  phone       text        not null,
  company     text,
  requirement text        not null,
  created_at  timestamptz not null default now()
);

-- One row per email sent for a lead. tracking_id is the opaque public id
-- used in the open pixel and click link (never expose raw db ids).
create table if not exists public.emails (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid        not null references public.leads(id) on delete cascade,
  sent_at     timestamptz not null default now(),
  opened_at   timestamptz,
  open_count  int         not null default 0,
  tracking_id uuid        not null unique default gen_random_uuid()
);

-- One row per tracked link click.
create table if not exists public.clicks (
  id         uuid primary key default gen_random_uuid(),
  email_id   uuid        not null references public.emails(id) on delete cascade,
  clicked_at timestamptz not null default now(),
  target_url text        not null
);

create index if not exists emails_tracking_id_idx on public.emails(tracking_id);
create index if not exists emails_lead_id_idx      on public.emails(lead_id);
create index if not exists clicks_email_id_idx      on public.clicks(email_id);

-- Enable RLS on all tables. No policies are defined, so the anon/public key
-- can do nothing. All access goes through server routes using the
-- service-role key, which bypasses RLS.
alter table public.leads  enable row level security;
alter table public.emails enable row level security;
alter table public.clicks enable row level security;
