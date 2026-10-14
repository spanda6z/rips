# RIPS LAB — Phase 2

Phase 2 introduces the secure account foundation for moving from a browser-only demo to a multi-user app.

## Included
- Email magic-link authentication through Supabase Auth.
- Account panel in the main application with editable display name.
- Signed-in collection hydration and background sync for demo balance, inventory, and activity.
- Database migration for profiles, per-user collections/activity, and a pack catalog.
- Row Level Security and least-privilege grants for exposed tables.
- New-user trigger to create a profile and collection record.
- Environment variable example; no credentials are committed.

## Setup
1. Create a Supabase project.
2. Run `supabase/migrations/202610140001_phase2_accounts.sql` in the Supabase SQL Editor.
3. In Supabase Auth URL configuration, add the production URL and local development URL to allowed redirect URLs.
4. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` to local and Vercel environment variables, then redeploy.
5. Test sign-in, profile/collection isolation with two accounts, and sign-out.

## Security and scope
- Never put a Supabase service-role or secret key in a `VITE_*` variable.
- Browser clients cannot write to the pack catalog. Administrative pack editing requires a trusted server/Edge Function and role verification.
- Pack rewards and balances remain simulated demo data. Signed-in demo collections sync to the database; anonymous sessions remain browser-local.
- Before any real-value launch, add server-authoritative pack opening, transaction/idempotency protections, RLS tests, rate limits, and automated end-to-end tests.
