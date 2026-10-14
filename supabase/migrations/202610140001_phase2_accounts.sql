-- RIPS LAB Phase 2: accounts and user-owned cloud records.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  demo_balance numeric(12,4) not null default 1.25 check (demo_balance >= 0),
  items jsonb not null default '[]'::jsonb check (jsonb_typeof(items) = 'array'),
  activity jsonb not null default '[]'::jsonb check (jsonb_typeof(activity) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table if not exists public.pack_catalog (
  id text primary key,
  name text not null,
  subtitle text not null default '',
  demo_price numeric(12,4) not null check (demo_price >= 0),
  accent text not null default '#8b5cf6',
  odds jsonb not null check (jsonb_typeof(odds) = 'object'),
  featured boolean not null default false,
  enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1), 'Ripper'))
  on conflict (id) do nothing;
  insert into public.user_collections (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_rips_lab on auth.users;
create trigger on_auth_user_created_rips_lab after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = ''
as $$ begin new.updated_at = now(); return new; end; $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
drop trigger if exists user_collections_updated_at on public.user_collections;
create trigger user_collections_updated_at before update on public.user_collections for each row execute procedure public.set_updated_at();
drop trigger if exists pack_catalog_updated_at on public.pack_catalog;
create trigger pack_catalog_updated_at before update on public.pack_catalog for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.user_collections enable row level security;
alter table public.pack_catalog enable row level security;
revoke all on public.profiles from anon, authenticated;
revoke all on public.user_collections from anon, authenticated;
revoke all on public.pack_catalog from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_collections to authenticated;
grant select on public.pack_catalog to anon, authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
drop policy if exists "Users can update their own basic profile" on public.profiles;
create policy "Users can update their own basic profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id and role = 'user');

drop policy if exists "Users can read their own collection" on public.user_collections;
create policy "Users can read their own collection" on public.user_collections for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own collection" on public.user_collections;
create policy "Users can create their own collection" on public.user_collections for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Users can update their own collection" on public.user_collections;
create policy "Users can update their own collection" on public.user_collections for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "Users can delete their own collection" on public.user_collections;
create policy "Users can delete their own collection" on public.user_collections for delete to authenticated using ((select auth.uid()) = user_id);

drop policy if exists "Visitors can read enabled packs" on public.pack_catalog;
create policy "Visitors can read enabled packs" on public.pack_catalog for select to anon, authenticated using (enabled = true);

-- Keep pack-catalog writes server-side. Never expose service-role keys in VITE_* variables.
