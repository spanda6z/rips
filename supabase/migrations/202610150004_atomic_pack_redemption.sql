-- RIPS LAB Phase 4: atomically redeem a verified Solana payment and grant its collectible.
-- The Edge Function verifies the transaction on-chain first, then calls this RPC with the server-generated reward.
-- Only service_role may execute this function; browser clients cannot mint collectibles by calling it directly.

create or replace function public.redeem_pack_payment(
  p_user_id uuid,
  p_signature text,
  p_pack_id text,
  p_buyer text,
  p_lamports bigint,
  p_rip jsonb,
  p_max_activity integer default 200
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inventory_count integer;
begin
  if p_user_id is null
     or p_signature is null or length(trim(p_signature)) = 0
     or p_pack_id is null or length(trim(p_pack_id)) = 0
     or p_buyer is null or length(trim(p_buyer)) = 0
     or p_lamports is null or p_lamports <= 0
     or p_rip is null or jsonb_typeof(p_rip) <> 'object'
     or p_rip ->> 'paymentSignature' is distinct from p_signature
     or p_rip ->> 'buyer' is distinct from p_buyer
     or coalesce(p_max_activity, 0) < 1 or p_max_activity > 1000 then
    raise exception 'Invalid payment redemption payload' using errcode = '22023';
  end if;

  -- Unique signature and inventory mutation share one transaction. If either step fails,
  -- PostgreSQL rolls back both, so a paid signature cannot be stranded without its reward.
  insert into public.pack_payments (
    user_id, signature, pack_id, buyer, lamports, memo_matched
  ) values (
    p_user_id, p_signature, p_pack_id, p_buyer, p_lamports, true
  );

  insert into public.user_collections (user_id, items, activity)
  values (p_user_id, jsonb_build_array(p_rip), jsonb_build_array(p_rip))
  on conflict (user_id) do update
  set items = jsonb_build_array(p_rip) || public.user_collections.items,
      activity = (
        select coalesce(jsonb_agg(entry.value order by entry.ordinality), '[]'::jsonb)
        from (
          select value, ordinality
          from jsonb_array_elements(
            jsonb_build_array(p_rip) || public.user_collections.activity
          ) with ordinality
          order by ordinality
          limit p_max_activity
        ) as entry
      );

  select jsonb_array_length(items)
  into v_inventory_count
  from public.user_collections
  where user_id = p_user_id;

  return jsonb_build_object('inventoryCount', v_inventory_count);
end;
$$;

revoke all on function public.redeem_pack_payment(uuid, text, text, text, bigint, jsonb, integer) from public, anon, authenticated;
grant execute on function public.redeem_pack_payment(uuid, text, text, text, bigint, jsonb, integer) to service_role;
