# RIPS — Solana production notes

## Real payments (no demo balance)

Pack prices (SOL):

| Pack | Price |
| --- | --- |
| starter | 0.05 |
| degen | 0.15 |
| legend | 0.4 |
| alpha | 0.75 |

Payment is a native SOL transfer to `VITE_TREASURY_WALLET` / `TREASURY_WALLET` with an optional memo `rips:v1:{packId}:{buyer}`.

## Mainnet checklist

- [ ] Treasury is a cold or multi-sig wallet you control
- [ ] Private RPC (rate limits + reliability)
- [ ] `VITE_SOLANA_NETWORK=mainnet-beta`
- [ ] Function secret `SOLANA_RPC_URL` points at the same cluster
- [ ] Test full path on devnet first
- [ ] Legal/compliance review if marketing paid collectibles

## Next (optional)

- On-chain pack program (Anchor) instead of transfer + memo
- Mint compressed NFT or SPL reward on open
- Wallet-only auth (sign-in with Solana) without email
