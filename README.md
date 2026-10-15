# RIPS LAB

RIPS LAB is a **demo-only** token pack experience built with React, TypeScript, Vite, and Supabase. It simulates opening packs and collecting items.

**It does not sell tokens or provide real assets, investment products, wallets, or blockchain transactions.**

## Live demo

https://rips-lac.vercel.app

## What’s included

- Pack shop with rarity odds and simulated SOL balance
- Inventory with search, rarity filters, sorting, and activity log
- Achievements / milestones
- Demo leaderboard
- Email magic-link authentication (Supabase)
- Per-user cloud collection sync with Row Level Security
- CSV export of inventory
- Responsive layout + privacy notice

## Policies and launch

- [Privacy notice](https://rips-lac.vercel.app/privacy.html)
- [Launch checklist](./LAUNCH_CHECKLIST.md)
- [Phase 2 — Accounts](./PHASE_2.md)
- [Phase 3 — Foundation](./PHASE_3.md)

## Run locally

```bash
npm install
cp .env.example .env   # fill VITE_SUPABASE_* if you want cloud features
npm run dev
```

## Quality checks

```bash
npm test
npm run build
```

The pack engine tests cover rarity odds validation, deterministic reward selection, missing rarity pools, and configured reward ranges.

## Production configuration

Configure these in Vercel for Production, Preview, and Development as needed:

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable / anon key

**Never put a Supabase secret or service-role key in frontend code, GitHub, or any `VITE_*` variable.** Keep database access protected by Row Level Security (RLS).

In Supabase Authentication, configure the production site URL and allowed redirect URLs to include the deployed RIPS LAB domain.

## Important boundary

This release is for a **demo launch only**. Do not accept payments, promise redeemable value, or represent demo balances and collectibles as real assets.

Any future real-money, transferable-asset, or on-chain Solana functionality requires a separate security, legal, and operational review. See `PHASE_3.md` for the recommended foundation work before that track.

## Version

0.4.0 — expanded token/pack catalog, build tooling, Phase 3 foundation docs.
