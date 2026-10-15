import { supabase } from './supabaseClient';
import type { Rip } from '../types';

export type OpenPackResult =
  | { ok: true; rip: Rip; balance: number; inventoryCount: number }
  | {
      ok: false;
      error: string;
      status: number;
      balance?: number;
      price?: number;
      retryAfterMs?: number;
    };

async function readFunctionError(error: unknown): Promise<{ message: string; status: number; body?: Record<string, unknown> }> {
  const fallback = { message: 'Server open failed', status: 500 as number };
  if (!error || typeof error !== 'object') return fallback;

  const err = error as {
    message?: string;
    context?: Response | { status?: number; json?: () => Promise<unknown>; body?: unknown };
  };

  let status = 500;
  let body: Record<string, unknown> | undefined;
  const ctx = err.context;

  if (ctx && typeof ctx === 'object') {
    if (typeof (ctx as Response).status === 'number') status = (ctx as Response).status;
    if (typeof (ctx as { status?: number }).status === 'number') status = (ctx as { status: number }).status;
    if (typeof (ctx as Response).json === 'function') {
      try {
        const parsed = await (ctx as Response).json();
        if (parsed && typeof parsed === 'object') body = parsed as Record<string, unknown>;
      } catch {
        // ignore parse errors
      }
    }
  }

  const message =
    (body && typeof body.error === 'string' && body.error) ||
    (typeof err.message === 'string' && err.message) ||
    fallback.message;

  return { message, status, body };
}

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
    const parsed = await readFunctionError(error);
    return {
      ok: false,
      error: parsed.message,
      status: parsed.status,
      balance: typeof parsed.body?.balance === 'number' ? parsed.body.balance : undefined,
      price: typeof parsed.body?.price === 'number' ? parsed.body.price : undefined,
      retryAfterMs: typeof parsed.body?.retryAfterMs === 'number' ? parsed.body.retryAfterMs : undefined,
    };
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
