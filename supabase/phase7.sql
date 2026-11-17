-- Run in Supabase SQL Editor
-- 1) Notifications: when each person last opened them, and when an entry was shared
alter table public.profiles add column if not exists notifs_seen_at timestamptz default now();
alter table public.entries add column if not exists shared_at timestamptz;
update public.entries set shared_at = created_at where visibility <> 'private' and shared_at is null;

-- 2) Fix missing sender names: make sure every account has a profile
create policy "insert own profile" on public.profiles for insert with check (auth.uid() = id);
insert into public.profiles (id, display_name)
select u.id, coalesce(u.raw_user_meta_data->>'display_name', u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1))
from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id);
update public.profiles p set display_name = split_part(u.email, '@', 1)
from auth.users u where u.id = p.id and (p.display_name is null or p.display_name = '');
