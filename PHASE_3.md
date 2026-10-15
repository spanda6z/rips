# RIPS LAB — Phase 3

## Status (v1.0.0 production demo)

| Piece | Status |
| --- | --- |
| Server-authoritative pack open | Implemented + deployed code on `main` |
| Client signed-in path | Implemented |
| Pack catalog seed | Implemented |
| Optimistic concurrency | Implemented |
| Open rate limit | Implemented |
| Demo leaderboard RPC | Implemented (`demo_leaderboard`) |
| Client leaderboard UI | Implemented (live + fictional fallback) |

## Deploy

```bash
# Migrations (SQL Editor or CLI)
# 202610140001_phase2_accounts.sql
# 202610150001_phase3_pack_seed.sql
# 202610150002_phase3_leaderboard.sql

supabase functions deploy open-pack
```

See [PRODUCTION.md](./PRODUCTION.md).

## Non-goals

Payments, real NFTs/tokens, wallet transfers, redeemable value.
