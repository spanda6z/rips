-- RIPS Solana: payment signatures (idempotency) + wallet link on profile

alter table public.profiles
  add column if not exists wallet_pubkey text;

create unique index if not exists profiles_wallet_pubkey_uidx
  on public.profiles (wallet_pubkey)
  where wallet_pubkey is not null;

create table if not exists public.pack_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  signature text not null unique,
  pack_id text not null,
  buyer text not null,
  lamports bigint not null check (lamports >= 0),
  memo_matched boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.pack_payments enable row level security;
revoke all on public.pack_payments from anon, authenticated;
grant select, insert on public.pack_payments to authenticated;

drop policy if exists "Users read own payments" on public.pack_payments;
create policy "Users read own payments" on public.pack_payments
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users insert own payments" on public.pack_payments;
create policy "Users insert own payments" on public.pack_payments
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
