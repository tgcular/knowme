-- Run in Supabase SQL Editor: paste ALL of this, then Run.
alter table public.profiles add column username text unique;
alter table public.profiles add constraint username_format check (username ~ '^[a-z0-9_]{3,20}$');
drop policy if exists "read own profile" on public.profiles;
create policy "read profiles" on public.profiles for select using (auth.role() = 'authenticated');

create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester uuid not null references auth.users(id) on delete cascade,
  addressee uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted')),
  created_at timestamptz default now(),
  check (requester <> addressee)
);
create unique index friendships_pair on public.friendships (least(requester, addressee), greatest(requester, addressee));
alter table public.friendships enable row level security;
create policy "see mine" on public.friendships for select using (auth.uid() in (requester, addressee));
create policy "send request" on public.friendships for insert with check (auth.uid() = requester and status = 'pending');
create policy "accept" on public.friendships for update using (auth.uid() = addressee) with check (auth.uid() = addressee);
create policy "remove" on public.friendships for delete using (auth.uid() in (requester, addressee));

alter table public.entries add column share_token uuid unique;
alter table public.entries add constraint vis_ok check (visibility in ('private','friends','users','link'));
create table public.entry_shares (
  entry_id uuid references public.entries(id) on delete cascade,
  friend_id uuid references auth.users(id) on delete cascade,
  primary key (entry_id, friend_id)
);
alter table public.entry_shares enable row level security;

create function public.owns_entry(eid uuid) returns boolean language sql security definer set search_path = public stable as
$$ select exists (select 1 from entries where id = eid and user_id = auth.uid()) $$;
create function public.shared_with_me(eid uuid) returns boolean language sql security definer set search_path = public stable as
$$ select exists (select 1 from entry_shares where entry_id = eid and friend_id = auth.uid()) $$;
create function public.are_friends(a uuid, b uuid) returns boolean language sql security definer set search_path = public stable as
$$ select exists (select 1 from friendships where status = 'accepted' and ((requester = a and addressee = b) or (requester = b and addressee = a))) $$;

create policy "owner manages shares" on public.entry_shares for all
  using (public.owns_entry(entry_id))
  with check (public.owns_entry(entry_id) and public.are_friends(auth.uid(), friend_id));
create policy "friend sees own shares" on public.entry_shares for select using (friend_id = auth.uid());

create policy "shared entries" on public.entries for select using (
  user_id <> auth.uid() and (
    visibility = 'users'
    or (visibility = 'friends' and public.shared_with_me(id) and public.are_friends(auth.uid(), user_id))
  )
);

create function public.can_view_photo(p text) returns boolean language sql security definer set search_path = public stable as
$$ select exists (select 1 from entries e where (e.front_path = p or e.back_path = p) and e.user_id <> auth.uid()
  and (e.visibility = 'users' or (e.visibility = 'friends' and public.shared_with_me(e.id) and public.are_friends(auth.uid(), e.user_id)))) $$;
create policy "view shared photos" on storage.objects for select using (bucket_id = 'photos' and public.can_view_photo(name));
