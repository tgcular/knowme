-- Run in Supabase SQL Editor
alter table public.profiles add column if not exists avatar_path text;

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', false) on conflict (id) do nothing;
create policy "own avatar files" on storage.objects for all
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "signed-in users read avatars" on storage.objects for select
  using (bucket_id = 'avatars' and auth.role() = 'authenticated');
