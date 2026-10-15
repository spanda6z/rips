# RIPS LAB — Production runbook (demo launch)

This release is a **demo product**. It is production-ready as a simulated pack experience, not as a payments or on-chain product.

## 1. Supabase

1. Create/select a Supabase project.
2. Run migrations in order in the SQL Editor:
   - `supabase/migrations/202610140001_phase2_accounts.sql`
   - `supabase/migrations/202610150001_phase3_pack_seed.sql`
   - `supabase/migrations/202610150002_phase3_leaderboard.sql`
3. Auth → URL configuration:
   - **Site URL:** `https://rips-lac.vercel.app` (or your custom domain)
   - **Redirect URLs:** include that origin and `http://localhost:5173` for local dev
4. Confirm RLS is enabled on `profiles`, `user_collections`, `pack_catalog`.
5. Deploy the Edge Function:

```bash
supabase login
supabase link --project-ref YOUR_REF
supabase functions deploy open-pack
```

6. Never put the **service role** key in Vercel `VITE_*` variables.

## 2. Vercel

1. Import the GitHub repo `spanda6z/rips`.
2. Framework: Vite (defaults are fine).
3. Environment variables (Production + Preview as needed):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key only)
4. Deploy from `main`. Confirm the deployment is **Ready**.
5. Optional custom domain: set DNS, then update Supabase Auth URLs.

## 3. Smoke test (required before announcing)

- [ ] Incognito load of production URL — no blank screen
- [ ] Mobile + desktop layout
- [ ] Anonymous: open each pack, inventory, CSV export, reset cancel
- [ ] Sign-in magic link returns to production origin
- [ ] Two accounts cannot see each other’s collections
- [ ] Sign-out clears the previous account’s collection from the UI
- [ ] Signed-in open uses server path (function deployed); errors are readable
- [ ] Leaderboard loads (live rows if RPC exists, otherwise labeled demo board)
- [ ] Privacy page + contact address present
- [ ] No service-role key in client network responses

## 4. Quality gate

```bash
npm ci
npm test
npm run build
```

## 5. Support

- Privacy: `/privacy.html`
- Contact: set a real inbox in `public/privacy.html` before broad promotion
- Demo disclaimer must remain visible; do not market balances as redeemable

## 6. Out of scope for this production demo

Payments, real wallets, NFT mints, token claims, and any redeemable value require a separate product, security, and legal track.
