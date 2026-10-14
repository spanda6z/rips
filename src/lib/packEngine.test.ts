import { describe, expect, it } from 'vitest';
import { packs } from '../data/packs';
import { tokens } from '../data/tokens';
import { chooseReward, validatePack } from './packEngine';

describe('pack configuration', () => {
  it('keeps every pack rarity distribution at exactly 100%', () => {
    for (const pack of packs) {
      expect(validatePack(pack)).toBeNull();
      expect(Object.values(pack.odds).reduce((sum, odds) => sum + odds, 0)).toBe(100);
    }
  });

  it('rejects invalid odds and invalid prices', () => {
    expect(validatePack({ ...packs[0], odds: { ...packs[0].odds, Common: -1 } })).toMatch(/invalid rarity odds/i);
    expect(validatePack({ ...packs[0], odds: { ...packs[0].odds, Common: 64 } })).toMatch(/add up to 100/i);
    expect(validatePack({ ...packs[0], price: -0.01 })).toMatch(/invalid demo price/i);
    expect(validatePack({ ...packs[0], price: Number.POSITIVE_INFINITY })).toMatch(/invalid demo price/i);
  });
});

describe('chooseReward', () => {
  it('selects a reward from the rolled rarity using deterministic randomness', () => {
    const rolls = [0.7, 0];
    const reward = chooseReward(packs[0], tokens, () => rolls.shift() ?? 0);
    expect(reward.rarity).toBe('Rare');
    expect(reward.id).toBe('wif');
  });

  it('supports the lowest and highest rarity ranges', () => {
    const commonRolls = [0, 0];
    expect(chooseReward(packs[0], tokens, () => commonRolls.shift() ?? 0).rarity).toBe('Common');

    const legendaryRolls = [0.99, 0.99];
    expect(chooseReward(packs[0], tokens, () => legendaryRolls.shift() ?? 0).rarity).toBe('Legendary');
  });

  it('fails clearly if a selected rarity has no sample tokens', () => {
    expect(() => chooseReward(packs[0], tokens.filter(token => token.rarity !== 'Common'), () => 0))
      .toThrow(/no demo tokens are configured for Common/i);
  });

  it('never returns a token outside the configured rarity pool', () => {
    for (const pack of packs) {
      const rolls = [0.99, 0];
      const reward = chooseReward(pack, tokens, () => rolls.shift() ?? 0);
      expect(reward.rarity).toBe('Legendary');
    }
  });
});
