# Pack engine checks

Run `npm test` for the automated pack-engine checks and `npm run build` for the TypeScript/Vite production build.

The reward engine is demo-only. Before production:
- [ ] Confirm all rarity odds total 100%.
- [ ] Reject negative, non-finite, and invalid prices.
- [ ] Fail clearly when a rarity has no configured sample tokens.
- [ ] Ensure demo credits never go negative.
- [ ] Replace `Math.random()` with an audited, verifiable randomness design before any real-value rewards.

## Phase 1 regression checklist
- [ ] Opening each pack subtracts its demo price once and adds one matching history and inventory item.
- [ ] A balance below the pack price shows a clear error and creates no reward.
- [ ] Refreshing preserves the demo balance, collection, and activity when browser storage is available.
- [ ] Malformed saved JSON and malformed inventory records do not crash the app.
- [ ] Reset asks for confirmation; cancel preserves data and confirm clears demo data.
- [ ] Escape closes pack, reward, token detail, and reset dialogs.
- [ ] Verify pack opening, inventory filters, and reset at mobile, tablet, and desktop widths.

## Phase 2 experience checklist
- [ ] Pack modal motion and reward reveal respect reduced-motion preferences.
- [ ] Search matches token name, ticker, and pack name.
- [ ] Rarity filters and all sort options update the visible collection.
- [ ] Empty search results provide a working clear-filters action.
- [ ] Selecting a collection item opens its details and closing the dialog returns to the collection.
- [ ] Activity log lists all demo pack openings in newest-first order.
