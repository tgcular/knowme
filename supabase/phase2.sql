-- Run in Supabase SQL Editor (paste the contents, then Run)
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mood text not null,
  body text,
  front_path text not null,
  back_path text not null,
  visibility text not null default 'private', -- Phase 3 will use this
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.entries enable row level security;
create policy "own entries" on public.entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public) values ('photos', 'photos', false);
create policy "own photos" on storage.objects for all
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
