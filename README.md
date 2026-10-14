# RIPS LAB

RIPS LAB is a demo-only token pack experience built with React, TypeScript, Vite, and Supabase. It simulates opening packs and collecting items. **It does not sell tokens or provide real assets, investment products, wallets, or blockchain transactions.**

## Live demo

https://rips-lac.vercel.app

## Run locally

```bash
npm install
npm run dev
```

## Quality checks

```bash
npm test
npm run build
```

The pack engine tests cover rarity odds validation, deterministic reward selection, missing rarity pools, and configured reward ranges. The manual regression checklist for persistence, dialogs, and responsive layouts is in `src/lib/packEngine.checklist.md`.

## Production configuration

Configure these in Vercel for Production, Preview, and Development as needed:

- `VITE_SUPABASE_URL`: the Supabase project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the Supabase publishable/anon key.

Only publishable client credentials belong in `VITE_*` variables. **Never put a Supabase secret or service-role key in frontend code, GitHub, or any `VITE_*` variable.** Keep database access protected by Row Level Security (RLS).

In Supabase Authentication, configure the production site URL and allowed redirect URLs to include the deployed RIPS LAB domain. Verify the email sign-in link returns users to the production site. Use a custom domain only after its DNS and HTTPS are working.

## Before announcing the demo

Follow [LAUNCH_CHECKLIST.md](./LAUNCH_CHECKLIST.md). At minimum, test the live site on a phone and desktop, sign in with a test account, verify data remains isolated between two test accounts, and confirm pack opening, inventory, activity, and sign-out work.

## Important boundary

This release is for a **demo launch only**. Do not accept payments, promise redeemable value, or represent demo balances and collectibles as real assets. Any future real-money or transferable-asset functionality requires a separate security, legal, and operational review.
