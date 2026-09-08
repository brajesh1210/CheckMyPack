-- CheckMyPack — initial schema.
--
-- Design notes that matter:
--
-- 1. Scans are the evidence base for the officer command centre, so a row is
--    append-only from the consumer's side: they may insert their own scans and
--    read them back, but never update or delete one. Tampering with evidence
--    after a complaint has been raised would defeat the point.
--
-- 2. The verdict is stored, but so are the raw findings. If the rule engine is
--    later corrected, we can re-adjudicate historical scans instead of
--    silently carrying forward a wrong call.
--
-- 3. Location is coarse (district + a jittered point). We need heat-maps, not
--    the ability to identify which shop a specific person visited.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────── profiles

create table if not exists public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text,
  role        text not null default 'consumer'
              check (role in ('consumer', 'officer', 'manufacturer')),
  -- Officers are approved manually; self-service would let anyone see the
  -- registry.
  officer_verified boolean not null default false,
  district    text,
  created_at  timestamptz not null default now()
);

comment on column public.profiles.officer_verified is
  'Set by an administrator only. Never grant this from the client.';

-- Every new auth user gets a consumer profile automatically.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────────────────── scans

create table if not exists public.scans (
  id            text primary key,              -- client-generated, e.g. CMP-1234-5678
  user_id       uuid references auth.users on delete set null,
  created_at    timestamptz not null default now(),
  scanned_at    timestamptz not null,          -- when the photo was taken on-device

  product_name  text not null,
  barcode       text,
  brand         text,

  verdict       text not null check (verdict in ('PASS', 'VIOLATION', 'RETAKE')),
  grade         text check (grade in ('A', 'B', 'C')),
  score         integer,
  expired       boolean not null default false,

  -- Which reader produced the fields, so a disputed scan can be audited.
  reader        text check (reader in ('gemini', 'tesseract', 'none')),
  rules_version text,

  findings      jsonb not null default '[]'::jsonb,
  quality       jsonb,

  district      text,
  state         text,
  lat           double precision,
  lng           double precision,

  image_path    text                            -- storage key, not the image itself
);

create index if not exists scans_user_idx     on public.scans (user_id, scanned_at desc);
create index if not exists scans_verdict_idx  on public.scans (verdict) where verdict = 'VIOLATION';
create index if not exists scans_barcode_idx  on public.scans (barcode) where barcode is not null;
create index if not exists scans_district_idx on public.scans (district);
create index if not exists scans_brand_idx    on public.scans (brand) where brand is not null;

-- ────────────────────────────────────────────────────────── complaints

create table if not exists public.complaints (
  id          uuid primary key default gen_random_uuid(),
  scan_id     text references public.scans on delete set null,
  user_id     uuid references auth.users on delete set null,
  created_at  timestamptz not null default now(),

  channel     text not null default 'in_app'
              check (channel in ('in_app', 'whatsapp', 'helpline_14404')),
  status      text not null default 'submitted'
              check (status in ('submitted', 'acknowledged', 'in_review', 'resolved', 'rejected')),
  reference   text,                              -- external docket number, once known
  notes       text,
  seller      text,
  district    text
);

create index if not exists complaints_status_idx on public.complaints (status, created_at desc);
create index if not exists complaints_user_idx   on public.complaints (user_id, created_at desc);

-- ─────────────────────────────────────────────── row level security

alter table public.profiles   enable row level security;
alter table public.scans      enable row level security;
alter table public.complaints enable row level security;

-- Helper: is the caller a verified officer?
create or replace function public.is_officer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role = 'officer'
      and officer_verified
  );
$$;

-- profiles ─────────────────────────────────────────────────────────
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_officer());

drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- A user must not be able to promote themselves to a verified officer.
create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
as $$
begin
  if not public.is_officer() then
    new.role := old.role;
    new.officer_verified := old.officer_verified;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- scans ────────────────────────────────────────────────────────────
drop policy if exists "insert own scan" on public.scans;
create policy "insert own scan" on public.scans
  for insert with check (user_id = auth.uid());

drop policy if exists "read own scans" on public.scans;
create policy "read own scans" on public.scans
  for select using (user_id = auth.uid() or public.is_officer());

-- Deliberately no update or delete policy: scans are evidence.

-- complaints ───────────────────────────────────────────────────────
drop policy if exists "insert own complaint" on public.complaints;
create policy "insert own complaint" on public.complaints
  for insert with check (user_id = auth.uid());

drop policy if exists "read own complaints" on public.complaints;
create policy "read own complaints" on public.complaints
  for select using (user_id = auth.uid() or public.is_officer());

drop policy if exists "officers update complaints" on public.complaints;
create policy "officers update complaints" on public.complaints
  for update using (public.is_officer());

-- ──────────────────────────────────────────── officer analytics views

-- Aggregates only. These power the heat-map and registry without exposing
-- individual scan rows, and they are safe to read for any verified officer.

create or replace view public.violation_hotspots
with (security_invoker = true) as
  select
    district,
    state,
    count(*)                                    as total_scans,
    count(*) filter (where verdict = 'VIOLATION') as violations,
    count(*) filter (where expired)             as expired_found,
    round(
      100.0 * count(*) filter (where verdict = 'VIOLATION') / nullif(count(*), 0),
      1
    )                                           as violation_rate,
    avg(lat)                                    as lat,
    avg(lng)                                    as lng,
    max(scanned_at)                             as last_seen
  from public.scans
  where district is not null
  group by district, state;

create or replace view public.repeat_offenders
with (security_invoker = true) as
  select
    brand,
    count(*)                                       as violation_count,
    count(distinct district)                       as districts_affected,
    count(distinct user_id)                        as reporters,
    array_agg(distinct f->>'id')                   as rule_ids,
    min(scanned_at)                                as first_reported,
    max(scanned_at)                                as last_reported
  from public.scans,
       lateral jsonb_array_elements(findings) f
  where verdict = 'VIOLATION'
    and brand is not null
    and (f->>'passed')::boolean is false
  group by brand
  having count(*) >= 2;

comment on view public.repeat_offenders is
  'Brands with two or more independently reported violations.';
