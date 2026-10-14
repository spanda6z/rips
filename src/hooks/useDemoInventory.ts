import { useEffect, useState } from 'react';
import type { Rip, Rarity } from '../types';

const KEY = 'rips-lab-demo-state-v1';
type State = { balance: number; inventory: Rip[]; history: Rip[] };
const initial: State = { balance: 1.25, inventory: [], history: [] };
const rarities: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary'];

function isRip(value: unknown): value is Rip {
  if (!value || typeof value !== 'object') return false;
  const rip = value as Partial<Rip>;
  const token = rip.token;
  if (!rip.id || typeof rip.id !== 'string' || typeof rip.packName !== 'string' ||
      typeof rip.openedAt !== 'string' || !token || typeof token !== 'object') return false;
  const item = token as Partial<Rip['token']>;
  return typeof item.id === 'string' && typeof item.name === 'string' &&
    typeof item.ticker === 'string' && typeof item.color === 'string' &&
    typeof item.icon === 'string' && typeof item.demoValue === 'number' &&
    Number.isFinite(item.demoValue) && item.demoValue >= 0 &&
    rarities.includes(item.rarity as Rarity);
}

function readSavedState(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return initial;
    const data = saved as Partial<State>;
    return {
      balance: typeof data.balance === 'number' && Number.isFinite(data.balance) && data.balance >= 0
        ? data.balance : initial.balance,
      inventory: Array.isArray(data.inventory) ? data.inventory.filter(isRip) : [],
      history: Array.isArray(data.history) ? data.history.filter(isRip) : [],
    };
  } catch {
    return initial;
  }
}

export function useDemoInventory() {
  const [state, setState] = useState<State>(readSavedState);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable or full; the demo still works for this session.
    }
  }, [state]);

  return {
    ...state,
    spend: (amount: number) => setState(s => ({
      ...s,
      balance: Math.max(0, Number((s.balance - amount).toFixed(4))),
    })),
    addRip: (rip: Rip) => setState(s => ({
      ...s,
      inventory: [rip, ...s.inventory],
      history: [rip, ...s.history],
    })),
    reset: () => setState(initial),
  };
}
