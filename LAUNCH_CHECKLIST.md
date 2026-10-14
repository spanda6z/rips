# RIPS LAB — Demo Launch Checklist

Use this checklist before publicly announcing the demo. Check items manually against the production URL; a successful deployment alone does not prove every user flow works.

## 1. Production and configuration

- [ ] Open https://rips-lac.vercel.app in a private/incognito window and confirm the page loads without a blank screen or visible console errors.
- [ ] Confirm the Vercel production deployment is **Ready** and is linked to the intended GitHub commit.
- [ ] Confirm Vercel Production environment variables include the correct `VITE_SUPABASE_URL` and publishable key.
- [ ] Confirm no Supabase secret/service-role key is present in frontend variables, source files, Git history, or client network responses. If one was exposed, rotate it.
- [ ] In Supabase Authentication URL configuration, set the production Site URL and allow the exact production callback/redirect URL used by the app.
- [ ] Confirm HTTPS works and the site layout is usable on a phone and desktop.

## 2. Authentication and account isolation

- [ ] Sign in with a test email and verify the email link returns to the production site.
- [ ] Verify a signed-in user can refresh the page and retain their own demo collection.
- [ ] Use two separate test accounts. Confirm neither account can read or overwrite the other's collection.
- [ ] Sign out and verify the app returns to an anonymous/demo state without showing the previous account's collection.
- [ ] Trigger a repeated sign-in request and confirm the cooldown/rate-limit message is understandable.
- [ ] Confirm database Row Level Security (RLS) is enabled and policies restrict collection/profile access to the owning authenticated user. Never rely on UI checks alone.

## 3. Core demo flows

- [ ] Open each enabled pack and confirm the result matches the configured rarity odds and reward pool.
- [ ] Confirm the balance changes correctly and cannot be driven below zero by repeated clicks or refreshes.
- [ ] Confirm inventory search, rarity filters, sorting, token details, achievements, and activity history work.
- [ ] Export inventory CSV and confirm the file opens and user-entered text is treated as data, not a formula.
- [ ] Test reset/cancel dialogs and verify cancel does not erase data.
- [ ] If the Supabase catalog is empty or unavailable, confirm the demo fallback packs still appear and the page remains usable.

## 4. Honest launch presentation

- [ ] Keep a clear notice that RIPS LAB is a demo: no real funds, assets, wallets, or blockchain transactions.
- [ ] Do not advertise demo balances or collectibles as redeemable or investment assets.
- [ ] Add a contact/support address and a privacy notice explaining what account data is stored before promoting broadly.
- [ ] Do not enable payments or real-money functionality as part of this demo launch.

## 5. Final smoke test

Run these commands from a clean checkout before merging future changes:

```bash
npm ci
npm test
npm run build
```

Then repeat the production checks after deployment. Record any failure and fix it before announcing the demo.
