-- Run this in Supabase SQL Editor before using "保存分析结果".
-- It creates a private Storage bucket and a per-user analysis table.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-photos',
  'meal-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.meal_photo_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text,
  image_path text not null,
  image_mime_type text not null default 'image/jpeg',
  foods jsonb not null default '[]'::jsonb,
  total jsonb not null default '{}'::jsonb,
  note text,
  created_at timestamptz not null default now()
);

alter table public.meal_photo_analyses enable row level security;

drop policy if exists "Users can read own meal photo analyses" on public.meal_photo_analyses;
create policy "Users can read own meal photo analyses"
on public.meal_photo_analyses
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own meal photo analyses" on public.meal_photo_analyses;
create policy "Users can insert own meal photo analyses"
on public.meal_photo_analyses
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own meal photo analyses" on public.meal_photo_analyses;
create policy "Users can delete own meal photo analyses"
on public.meal_photo_analyses
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can upload own meal photos" on storage.objects;
create policy "Users can upload own meal photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read own meal photos" on storage.objects;
create policy "Users can read own meal photos"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own meal photos" on storage.objects;
create policy "Users can delete own meal photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'meal-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
