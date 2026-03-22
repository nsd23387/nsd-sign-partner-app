-- ============================================================
-- NSD Sign Partner Portal — Supabase Schema
-- Run this in your Supabase project > SQL Editor
-- ============================================================

-- Partners table
create table if not exists public.partners (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid references auth.users(id) on delete cascade,
  company_name    text not null,
  contact_name    text not null,
  email           text not null unique,
  phone           text,
  partner_type    text not null default 'sign_shop'
                  check (partner_type in ('sign_shop','event_company','interior_designer','agency','other')),
  tier            text not null default 'silver'
                  check (tier in ('silver','gold','platinum')),
  discount_pct    integer not null default 20,
  portal_slug     text unique,          -- e.g. "signarama-greenville"
  logo_url        text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Quotes table
create table if not exists public.quotes (
  id                uuid primary key default gen_random_uuid(),
  quote_number      text unique,        -- populated by trigger below
  partner_id        uuid not null references public.partners(id) on delete cascade,
  partner_tag       text not null default 'sign_partner',

  -- Sign specs
  sign_type         text not null check (sign_type in ('logo_image','text_only')),
  material          text not null check (material in ('led_flex_neon','led_flex_neon_uv','channel_letter')),
  installation_type text not null check (installation_type in ('indoors','outdoors')),
  width_inches      numeric,
  height_inches     numeric,
  back_color        text not null check (back_color in ('transparent','black','other')),
  back_color_other  text,
  back_shape        text not null check (back_shape in ('cut_to_shape','cut_to_circle','cut_to_square_rect','cut_to_lettering')),
  sign_colors       text not null,
  quantity          integer not null default 1,
  additional_notes  text,

  -- End-client (white-labelled, internal only)
  client_name       text,
  client_email      text,

  -- Pricing (populated by NSD backend after review)
  list_price        numeric,
  partner_price     numeric,
  discount_pct      integer not null default 20,

  status            text not null default 'draft'
                    check (status in (
                      'draft','submitted','awaiting_mockup','mockup_review',
                      'management_review','approved','sent_to_client','completed','cancelled'
                    )),
  submitted_at      timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Design files table
create table if not exists public.design_files (
  id           uuid primary key default gen_random_uuid(),
  quote_id     uuid not null references public.quotes(id) on delete cascade,
  file_name    text not null,
  file_url     text not null,
  file_type    text,
  size_bytes   bigint,
  uploaded_at  timestamptz not null default now()
);

-- ── Auto-generate quote numbers (QT-NSD500001, etc.) ──────────────────────
create sequence if not exists quote_number_seq start 500001;

create or replace function generate_quote_number()
returns trigger language plpgsql as $$
begin
  new.quote_number := 'QT-NSD' || nextval('quote_number_seq');
  return new;
end;
$$;

create trigger set_quote_number
  before insert on public.quotes
  for each row when (new.quote_number is null)
  execute function generate_quote_number();

-- ── updated_at auto-bump ──────────────────────────────────────────────────
create or replace function touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger quotes_updated_at
  before update on public.quotes
  for each row execute function touch_updated_at();

-- ── Row Level Security ────────────────────────────────────────────────────
alter table public.partners     enable row level security;
alter table public.quotes        enable row level security;
alter table public.design_files  enable row level security;

-- Partners can only see their own row
create policy "partner_select_own" on public.partners
  for select using (auth.uid() = auth_user_id);

create policy "partner_update_own" on public.partners
  for update using (auth.uid() = auth_user_id);

-- Partners can only see/insert/update their own quotes
create policy "quotes_select_own" on public.quotes
  for select using (
    partner_id in (select id from public.partners where auth_user_id = auth.uid())
  );

create policy "quotes_insert_own" on public.quotes
  for insert with check (
    partner_id in (select id from public.partners where auth_user_id = auth.uid())
  );

create policy "quotes_update_own" on public.quotes
  for update using (
    partner_id in (select id from public.partners where auth_user_id = auth.uid())
  );

-- Design files follow quote access
create policy "files_select_own" on public.design_files
  for select using (
    quote_id in (
      select q.id from public.quotes q
      join public.partners p on p.id = q.partner_id
      where p.auth_user_id = auth.uid()
    )
  );

create policy "files_insert_own" on public.design_files
  for insert with check (
    quote_id in (
      select q.id from public.quotes q
      join public.partners p on p.id = q.partner_id
      where p.auth_user_id = auth.uid()
    )
  );

-- ── Storage bucket for design files ──────────────────────────────────────
-- Run this separately in Supabase Storage settings, or via API:
-- create bucket "design-files" with public = true;
