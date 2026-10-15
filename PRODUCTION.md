# RIPS — Production runbook

## 1. Supabase

1. Run migrations in order:
   - `202610140001_phase2_accounts.sql`
   - `202610150001_phase3_pack_seed.sql`
   - `202610150002_phase3_leaderboard.sql`
   - `202610150003_solana_payments.sql`
2. Auth URL configuration: Site URL + redirects = production origin (and localhost for dev).
3. Confirm RLS on `profiles`, `user_collections`, `pack_catalog`, `pack_payments`.
4. Deploy functions:

```bash
supabase functions deploy open-pack-sol
# optional legacy demo path:
# supabase functions deploy open-pack
```

5. Function secrets: `SOLANA_RPC_URL`, `TREASURY_WALLET`.
6. Never put the service role key in `VITE_*` variables.

## 2. Vercel

| Variable | Required |
| --- | --- |
| `VITE_SUPABASE_URL` | yes |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | yes (anon only) |
| `VITE_TREASURY_WALLET` | yes for live packs |
| `VITE_SOLANA_NETWORK` | `devnet` or `mainnet-beta` |
| `VITE_SOLANA_RPC_URL` | recommended private RPC |

Deploy from `main`. Confirm deployment Ready.

## 3. Smoke test (devnet first)

- [ ] Site loads; wallet button visible
- [ ] Sign in + connect Phantom/Solflare
- [ ] Buy starter pack: approve SOL transfer
- [ ] Signature confirms on explorer; inventory updates
- [ ] Reusing the same signature is rejected
- [ ] Cancel in wallet shows a clear message
- [ ] Two accounts cannot see each other’s collections
- [ ] No service-role key in client network traffic

## 4. Mainnet

Only after a clean devnet run. Treasury should be a wallet you control (ideally multi-sig). Update network env + function RPC to mainnet.

## 5. Quality gate

```bash
npm ci
npm test
npm run build
```
