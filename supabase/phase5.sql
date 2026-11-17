-- Run in Supabase SQL Editor
alter table public.entries add column if not exists location text;
alter table public.entries add column if not exists write_seconds integer not null default 0;
