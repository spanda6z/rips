# Pack engine checks

The reward engine is demo-only. Before production:
- [ ] Confirm all rarity odds total 100%.
- [ ] Reject negative, non-finite, and invalid prices.
- [ ] Fail clearly when a rarity has no configured sample tokens.
- [ ] Ensure demo credits never go negative.
- [ ] Replace `Math.random()` with an audited, verifiable randomness design before any real-value rewards.