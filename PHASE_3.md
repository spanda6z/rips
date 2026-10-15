# RIPS LAB — Phase 3 Foundation

Phase 3 moves the demo toward a more robust multi-user experience while keeping the **demo-only** boundary clear. Real-value or transferable assets remain out of scope until a separate security, legal, and operational review.

## Status (v0.4.1)

| Piece | Status |
| --- | --- |
| Server-authoritative pack open (`open-pack` Edge Function) | Implemented |
| Client uses Edge Function when signed in + collection hydrated | Implemented |
| Pack catalog seed migration | Implemented |
| Optimistic concurrency on balance | Implemented |
| Light rate limit between opens | Implemented |
| Signed-in leaderboard | Planned |
| Full RPC lock / service-role path | Optional hardening |

## Deploy the Edge Function

1. Install Supabase CLI and link the project.
2. Run migrations (Phase 2 accounts + Phase 3 pack seed) in the SQL Editor or via CLI.
3. Deploy:

```bash
supabase functions deploy open-pack
```

4. Confirm the function is reachable from the browser (signed-in user opens a pack).
5. Anonymous / local demo still uses the client-side pack engine.

## How opens work

**Signed in (cloud ready)**  
Client → `supabase.functions.invoke('open-pack')` → auth check → load pack (DB or defaults) → balance check → rate limit → roll reward → update `user_collections` under RLS → return Rip.

**Anonymous / local**  
Client → `chooseReward` + local state (unchanged).

## Goals still open

1. Signed-in leaderboard (RPC or view over `user_collections`).
2. Stronger concurrency (SECURITY DEFINER function with row lock).
3. Structured logging / metrics on opens.
4. Admin-only pack catalog writes.

## Explicit non-goals

- Accepting payments
- Minting real NFTs or tokens
- Wallet connections that move real assets
- Promising redeemable value for demo balances

Any future real Solana integration must be a separate product track with its own security review.
