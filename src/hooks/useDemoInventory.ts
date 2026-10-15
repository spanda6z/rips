import { useEffect, useState } from 'react';
import type { Rip, Rarity } from '../types';
import { supabase } from '../lib/supabaseClient';

const KEY = 'rips-lab-demo-state-v1';
type State = { balance: number; inventory: Rip[]; history: Rip[] };
const initial: State = { balance: 1.25, inventory: [], history: [] };
const rarities: Rarity[] = ['Common', 'Rare', 'Epic', 'Legendary'];

function isRip(value: unknown): value is Rip {
  if (!value || typeof value !== 'object') return false;
  const rip = value as Partial<Rip>;
  const token = rip.token;
  if (
    !rip.id ||
    typeof rip.id !== 'string' ||
    typeof rip.packName !== 'string' ||
    typeof rip.openedAt !== 'string' ||
    !token ||
    typeof token !== 'object'
  ) {
    return false;
  }
  const item = token as Partial<Rip['token']>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.ticker === 'string' &&
    typeof item.color === 'string' &&
    typeof item.icon === 'string' &&
    typeof item.demoValue === 'number' &&
    Number.isFinite(item.demoValue) &&
    item.demoValue >= 0 &&
    rarities.includes(item.rarity as Rarity)
  );
}

function readSavedState(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initial;
    const saved: unknown = JSON.parse(raw);
    if (!saved || typeof saved !== 'object') return initial;
    const data = saved as Partial<State>;
    return {
      balance:
        typeof data.balance === 'number' && Number.isFinite(data.balance) && data.balance >= 0
          ? data.balance
          : initial.balance,
      inventory: Array.isArray(data.inventory) ? data.inventory.filter(isRip) : [],
      history: Array.isArray(data.history) ? data.history.filter(isRip) : [],
    };
  } catch {
    return initial;
  }
}

export function useDemoInventory() {
  const [state, setState] = useState<State>(readSavedState);
  const [cloudUser, setCloudUser] = useState<string | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  /** When true, signed-in opens should go through the Edge Function, not local random. */
  const [serverOpens, setServerOpens] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage can be unavailable or full; the demo still works for this session.
    }
  }, [state]);

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      const userId = data.session?.user.id ?? null;
      setCloudUser(userId);
      if (userId) {
        // Never upload a browser's anonymous/local collection into a signed-in account.
        setState(initial);
        setCloudReady(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      const userId = session?.user.id ?? null;
      if (event === 'INITIAL_SESSION' && !userId) {
        setCloudUser(null);
        return;
      }
      if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
        if (userId) {
          setCloudReady(false);
          setState(initial);
          setCloudUser(userId);
        }
      } else if (event === 'SIGNED_OUT') {
        setCloudReady(false);
        setCloudUser(null);
        setServerOpens(false);
        setState(initial);
      } else if (userId) {
        setCloudUser(userId);
      }
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !cloudUser) {
      setCloudReady(false);
      setServerOpens(false);
      return;
    }
    let active = true;
    setCloudReady(false);
    supabase
      .from('user_collections')
      .select('demo_balance, items, activity')
      .eq('user_id', cloudUser)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) {
          setCloudReady(false);
          setServerOpens(false);
          return;
        }
        if (data) {
          const remoteItems = Array.isArray(data.items) ? data.items.filter(isRip) : [];
          const remoteActivity = Array.isArray(data.activity) ? data.activity.filter(isRip) : [];
          const remoteBalance = Number(data.demo_balance);
          setState({
            balance: Number.isFinite(remoteBalance) && remoteBalance >= 0 ? remoteBalance : initial.balance,
            inventory: remoteItems,
            history: remoteActivity,
          });
        }
        setCloudReady(true);
        setServerOpens(true);
      });
    return () => {
      active = false;
    };
  }, [cloudUser]);

  // Background sync for local mutations (anonymous path + profile edits).
  // Server opens already wrote the authoritative row; still safe to upsert the same snapshot.
  useEffect(() => {
    if (!supabase || !cloudUser || !cloudReady) return;
    const snapshot = {
      user_id: cloudUser,
      demo_balance: state.balance,
      items: state.inventory,
      activity: state.history,
    };
    supabase
      .from('user_collections')
      .upsert(snapshot, { onConflict: 'user_id' })
      .then(({ error }) => {
        if (error) console.warn('RIPS LAB cloud collection sync is unavailable.', error.message);
      });
  }, [state, cloudUser, cloudReady]);

  return {
    ...state,
    cloudUser,
    cloudReady,
    /** Prefer Edge Function when the signed-in collection is hydrated. */
    useServerOpen: Boolean(cloudUser && cloudReady && serverOpens && supabase),
    spend: (amount: number) =>
      setState((s) => ({
        ...s,
        balance: Math.max(0, Number((s.balance - amount).toFixed(4))),
      })),
    addRip: (rip: Rip) =>
      setState((s) => ({
        ...s,
        inventory: [rip, ...s.inventory],
        history: [rip, ...s.history],
      })),
    openRip: (amount: number, rip: Rip) =>
      setState((s) => ({
        ...s,
        balance: Math.max(0, Number((s.balance - amount).toFixed(4))),
        inventory: [rip, ...s.inventory],
        history: [rip, ...s.history],
      })),
    /** Apply result returned by the Edge Function (already persisted server-side). */
    applyServerOpen: (rip: Rip, balance: number) =>
      setState((s) => ({
        balance: Math.max(0, Number(balance.toFixed(4))),
        inventory: [rip, ...s.inventory.filter((r) => r.id !== rip.id)],
        history: [rip, ...s.history.filter((r) => r.id !== rip.id)],
      })),
    reset: () => setState(initial),
  };
}
