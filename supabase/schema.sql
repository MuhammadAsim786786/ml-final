-- ============================================================================
-- DermaScan — Supabase schema
-- Run this in the Supabase SQL Editor (or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE / DROP POLICY guards.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. profiles : one row per auth user (auto-created by trigger on signup)
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  theme       text not null default 'system',
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by owner" on public.profiles;
create policy "Profiles are viewable by owner"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- 2. predictions : one row per classified image
-- ----------------------------------------------------------------------------
create table if not exists public.predictions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  image_path       text not null,            -- path inside the `scans` storage bucket
  predicted_label  text not null,            -- human-readable label, e.g. "Eczema"
  predicted_id     text not null,            -- canonical id, e.g. "eczema"
  confidence       numeric not null,         -- 0..1 score of the top class
  scores           jsonb not null default '[]'::jsonb,  -- full ranked [{id,label,score}]
  source           text not null default 'mock',        -- 'model' | 'mock'
  created_at       timestamptz not null default now()
);

create index if not exists predictions_user_created_idx
  on public.predictions (user_id, created_at desc);

alter table public.predictions enable row level security;

drop policy if exists "Users can read own predictions" on public.predictions;
create policy "Users can read own predictions"
  on public.predictions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own predictions" on public.predictions;
create policy "Users can insert own predictions"
  on public.predictions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own predictions" on public.predictions;
create policy "Users can delete own predictions"
  on public.predictions for delete
  using (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. Trigger : auto-create a profile row when a new auth user signs up
-- ----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- 4. Storage : private bucket for uploaded scan images
--    Files are stored at `<user_id>/<uuid>.<ext>`; access is per-user via the
--    first path segment matching auth.uid().
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('scans', 'scans', false)
on conflict (id) do nothing;

drop policy if exists "Users can read own scan images" on storage.objects;
create policy "Users can read own scan images"
  on storage.objects for select
  using (
    bucket_id = 'scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can upload own scan images" on storage.objects;
create policy "Users can upload own scan images"
  on storage.objects for insert
  with check (
    bucket_id = 'scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Users can delete own scan images" on storage.objects;
create policy "Users can delete own scan images"
  on storage.objects for delete
  using (
    bucket_id = 'scans'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ----------------------------------------------------------------------------
-- Done. Reminder: in Auth → Providers → Email, turn OFF "Confirm email"
-- for the demo-friendly instant-login flow.
-- ----------------------------------------------------------------------------
