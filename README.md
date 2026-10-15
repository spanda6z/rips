# RIPS

**v2.0.0 — Solana pack shop (real SOL payments)**

Open packs by paying the treasury in SOL from your wallet. The server verifies the on-chain transfer, rolls the reward, and stores your collection.

## Stack

- React + Vite + TypeScript
- Solana wallet adapter (Phantom, Solflare)
- Supabase Auth + RLS inventory
- Edge Function `open-pack-sol` (payment verify + pack open)

## Configure

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Auth + inventory |
| `VITE_SOLANA_NETWORK` | `devnet` or `mainnet-beta` |
| `VITE_SOLANA_RPC_URL` | Optional private RPC |
| `VITE_TREASURY_WALLET` | Base58 pubkey that receives pack SOL |

**Edge Function secrets (Supabase):** `SOLANA_RPC_URL`, `TREASURY_WALLET` (same pubkey).

## Deploy

1. Run SQL migrations (Phase 2 accounts + pack seed + leaderboard + `202610150003_solana_payments.sql`).
2. `supabase functions deploy open-pack-sol`
3. Set function secrets for RPC + treasury.
4. Set Vercel env vars (including treasury + network).
5. Start on **devnet**, fund a test wallet, buy a pack end-to-end before mainnet.

## Flow

1. Sign in (magic link).
2. Connect wallet.
3. Open pack → sign SOL transfer to treasury (memo binds pack + buyer).
4. Client sends signature to `open-pack-sol`.
5. Server confirms transfer amount + accounts, rolls rarity, writes inventory.

## Local

```bash
npm install
npm run dev
```

## Notes

- Inventory items are **off-chain records** after a real SOL payment (not NFT mints yet).
- NFT / SPL mint on open can be added as a follow-up program.
- Never put the Supabase **service role** key in `VITE_*` vars.
