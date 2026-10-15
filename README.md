# RIPS LAB

**Production demo v1.0.0** — a simulated token-pack experience built with React, TypeScript, Vite, and Supabase.

**It does not sell tokens or provide real assets, investment products, wallets, or blockchain transactions.**

## Live

https://rips-lac.vercel.app

## Features

- Pack shop with published rarity odds and simulated SOL balance
- Inventory (search, rarity filters, sort, CSV export, activity)
- Achievements
- Demo leaderboard (live aggregates when migration is applied)
- Email magic-link auth + cloud collection sync (RLS)
- Server-authoritative pack opens for signed-in users (`open-pack` Edge Function)
- Privacy notice and production runbook

## Docs

| Doc | Purpose |
| --- | --- |
| [PRODUCTION.md](./PRODUCTION.md) | Deploy + smoke-test runbook |
| [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md) | Pre-announce checklist |
| [PHASE_2.md](./PHASE_2.md) | Accounts foundation |
| [PHASE_3.md](./PHASE_3.md) | Server opens + leaderboard |
| [Privacy](https://rips-lac.vercel.app/privacy.html) | Privacy notice |

## Local

```bash
npm install
cp .env.example .env   # VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

```bash
npm test
npm run build
```

## Production deploy (summary)

1. Run all SQL migrations in Supabase.
2. `supabase functions deploy open-pack`
3. Set Vercel env vars (publishable key only).
4. Point Supabase Auth Site URL + redirects at the production domain.
5. Walk through `PRODUCTION.md` smoke tests.

## Boundary

This is a **demo launch**. No payments, no real wallets, no redeemable balances. Any on-chain or real-money product is a separate track.
