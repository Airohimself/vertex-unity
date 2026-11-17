-- Vertex Unity: Supabase schema.
-- Paste this whole file into Supabase -> SQL Editor -> New query -> Run.
-- It is safe to run more than once.

-- 1) One row per student: profile, saved items, applications, essays, settings...
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- 2) Community corrections to the university catalogue (Data Health page).
create table if not exists public.catalog_overrides (
  id         text primary key,            -- university id, e.g. 'mit'
  patch      jsonb not null default '{}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

-- 3) Community chat messages.
create table if not exists public.messages (
  id         bigint generated always as identity primary key,
  channel    text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  card       text,
  body       text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_channel_created_idx on public.messages (channel, created_at desc);

-- ---------------------------------------------------------------- security
alter table public.user_state        enable row level security;
alter table public.catalog_overrides enable row level security;
alter table public.messages          enable row level security;

drop policy if exists "own state read"   on public.user_state;
drop policy if exists "own state insert" on public.user_state;
drop policy if exists "own state update" on public.user_state;
create policy "own state read"   on public.user_state for select using (auth.uid() = user_id);
create policy "own state insert" on public.user_state for insert with check (auth.uid() = user_id);
create policy "own state update" on public.user_state for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "overrides read"   on public.catalog_overrides;
drop policy if exists "overrides write"  on public.catalog_overrides;
drop policy if exists "overrides update" on public.catalog_overrides;
create policy "overrides read"   on public.catalog_overrides for select using (true);
-- Any signed-in student may fix data (like the original app). To restrict to
-- admins only, replace `true` below with:  auth.uid() in ('<your-user-uuid>')
create policy "overrides write"  on public.catalog_overrides for insert with check (auth.uid() is not null);
create policy "overrides update" on public.catalog_overrides for update using (auth.uid() is not null);

drop policy if exists "messages read"   on public.messages;
drop policy if exists "messages insert" on public.messages;
drop policy if exists "messages delete" on public.messages;
create policy "messages read"   on public.messages for select using (auth.uid() is not null);
create policy "messages insert" on public.messages for insert with check (auth.uid() = user_id);
create policy "messages delete" on public.messages for delete using (auth.uid() = user_id);

-- live chat updates
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------- file storage
-- Private bucket; every student can only touch files inside their own folder.
insert into storage.buckets (id, name, public, file_size_limit)
values ('user-files', 'user-files', false, 52428800)
on conflict (id) do nothing;

drop policy if exists "files read own"   on storage.objects;
drop policy if exists "files insert own" on storage.objects;
drop policy if exists "files delete own" on storage.objects;
create policy "files read own"   on storage.objects for select
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "files insert own" on storage.objects for insert
  with check (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "files delete own" on storage.objects for delete
  using (bucket_id = 'user-files' and (storage.foldername(name))[1] = auth.uid()::text);
