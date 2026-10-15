# RIPS LAB — Phase 3 Foundation

Phase 3 moves the demo toward a more robust multi-user experience while keeping the **demo-only** boundary clear. Real-value or transferable assets remain out of scope until a separate security, legal, and operational review.

## Goals

1. **Server-authoritative pack opening** (recommended before any real-value work)
   - Open packs via a Supabase Edge Function or trusted backend.
   - Enforce balance checks, rarity rolls, and rate limits on the server.
   - Client only displays results; it never decides the reward alone.

2. **Signed-in leaderboard**
   - Rank authenticated users by simulated collection value or pack count.
   - Keep a clear “demo leaderboard” label.
   - Fallback to the existing fictional board when no signed-in data is available.

3. **Rate limits & abuse protection**
   - Per-user open cooldown.
   - Supabase Auth rate limits already help magic-link abuse.
   - Optional: Edge Function rate limiting by IP / user id.

4. **Admin pack catalog**
   - Pack catalog writes stay server-side (service role or Edge Function with role check).
   - Never expose service-role keys to the browser.

5. **Observability**
   - Structured logs for pack opens and auth events.
   - Basic health checks.

## Scaffold already present or planned

- Expanded token & pack pools (client fallback catalog).
- Achievements updated for 4 packs.
- `vite.config.ts`, proper dependency pins, `.gitignore`.
- Migration and RLS from Phase 2 remain the foundation.

## Recommended next implementation order

1. Create `supabase/functions/open-pack` (Deno Edge Function) that:
   - Authenticates the caller.
   - Reads & locks the user’s collection row.
   - Validates balance, deducts demo price, rolls reward, appends inventory/activity.
   - Returns the new Rip.

2. Switch the client pack-open path to call the Edge Function when the user is signed in.

3. Add a simple `leaderboard` view or RPC that returns top N signed-in collections (demo value only).

4. Add automated RLS + function tests.

## Explicit non-goals for Phase 3

- Accepting payments
- Minting real NFTs or tokens
- Wallet connections that move real assets
- Promising redeemable value for demo balances

Any future real Solana integration (wallet connect, on-chain packs, etc.) must be treated as a separate product track with its own security review, not an incremental toggle on this demo.
