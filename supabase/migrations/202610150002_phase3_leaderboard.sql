-- RIPS LAB Phase 3: public demo leaderboard (read-only aggregates).
-- Exposes only display name + simulated stats. No emails, no full inventory.

create or replace function public.demo_leaderboard(limit_n integer default 10)
returns table (
  rank bigint,
  display_name text,
  rips_count integer,
  demo_value numeric
)
language sql
stable
security definer
set search_path = public
as $$
  with ranked as (
    select
      coalesce(nullif(trim(p.display_name), ''), 'Ripper') as display_name,
      coalesce(jsonb_array_length(c.items), 0)::integer as rips_count,
      coalesce((
        select sum((item->'token'->>'demoValue')::numeric)
        from jsonb_array_elements(c.items) as item
        where (item->'token'->>'demoValue') ~ '^[0-9]+(\.[0-9]+)?$'
      ), 0)::numeric(12,4) as demo_value
    from public.user_collections c
    left join public.profiles p on p.id = c.user_id
    where coalesce(jsonb_array_length(c.items), 0) > 0
  )
  select
    row_number() over (order by r.demo_value desc, r.rips_count desc, r.display_name asc) as rank,
    r.display_name,
    r.rips_count,
    r.demo_value
  from ranked r
  order by r.demo_value desc, r.rips_count desc, r.display_name asc
  limit greatest(1, least(coalesce(limit_n, 10), 50));
$$;

revoke all on function public.demo_leaderboard(integer) from public;
grant execute on function public.demo_leaderboard(integer) to anon, authenticated;
