import { supabase } from './supabaseClient';
import type { Rip } from '../types';

export type OpenPackResult =
  | { ok: true; rip: Rip; balance: number; inventoryCount: number }
  | { ok: false; error: string; status: number; balance?: number; price?: number; retryAfterMs?: number };

/**
 * Server-authoritative pack open for signed-in users.
 * Requires Supabase Auth session + deployed `open-pack` Edge Function.
 */
export async function openPackServer(packId: string): Promise<OpenPackResult> {
  if (!supabase) {
    return { ok: false, error: 'Cloud is not configured', status: 503 };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  const session = sessionData.session;
  if (!session?.access_token) {
    return { ok: false, error: 'Sign in required for server opens', status: 401 };
  }

  const { data, error } = await supabase.functions.invoke('open-pack', {
    body: { packId },
  });

  if (error) {
    // functions.invoke puts non-2xx bodies in error.context sometimes
    const msg = error.message || 'Server open failed';
    // Try to surface status from context if present
    const status =
      typeof (error as { context?: { status?: number } }).context?.status === 'number'
        ? (error as { context: { status: number } }).context.status
        : 500;
    return { ok: false, error: msg, status };
  }

  if (!data || typeof data !== 'object') {
    return { ok: false, error: 'Empty response from open-pack', status: 500 };
  }

  const body = data as Record<string, unknown>;
  if (body.ok === true && body.rip && typeof body.balance === 'number') {
    return {
      ok: true,
      rip: body.rip as Rip,
      balance: body.balance,
      inventoryCount: typeof body.inventoryCount === 'number' ? body.inventoryCount : 0,
    };
  }

  return {
    ok: false,
    error: typeof body.error === 'string' ? body.error : 'Open failed',
    status: 400,
    balance: typeof body.balance === 'number' ? body.balance : undefined,
    price: typeof body.price === 'number' ? body.price : undefined,
    retryAfterMs: typeof body.retryAfterMs === 'number' ? body.retryAfterMs : undefined,
  };
}
