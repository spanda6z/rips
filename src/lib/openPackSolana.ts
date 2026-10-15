import type { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { supabase } from './supabaseClient';
import { buildPackPaymentTx, getConnection } from './solanaPay';
import { isSolanaConfigured, packPriceSol } from './solanaConfig';
import type { Rip } from '../types';

export type SolOpenResult =
  | { ok: true; rip: Rip; signature: string }
  | { ok: false; error: string };

type SendTx = (tx: Transaction, connection: Connection) => Promise<string>;

/**
 * Pay treasury in SOL, then call open-pack-sol with the signature for server verification + roll.
 * Requires connected wallet + signed-in Supabase session.
 */
export async function openPackWithSol(params: {
  packId: string;
  priceSol: number;
  publicKey: PublicKey;
  sendTransaction: SendTx;
}): Promise<SolOpenResult> {
  if (!isSolanaConfigured) {
    return { ok: false, error: 'Treasury wallet is not configured on this deployment' };
  }
  if (!supabase) {
    return { ok: false, error: 'Supabase is not configured' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { ok: false, error: 'Sign in required before purchasing a pack' };
  }

  try {
    const price = packPriceSol(params.packId, params.priceSol);
    const tx = await buildPackPaymentTx({
      buyer: params.publicKey,
      packId: params.packId,
      priceSol: price,
    });
    const connection = getConnection();
    const signature = await params.sendTransaction(tx, connection);
    await connection.confirmTransaction(signature, 'confirmed');

    const { data, error } = await supabase.functions.invoke('open-pack-sol', {
      body: {
        packId: params.packId,
        signature,
        buyer: params.publicKey.toBase58(),
      },
    });

    if (error) {
      return { ok: false, error: error.message || 'Server failed to verify payment' };
    }
    const body = data as Record<string, unknown>;
    if (body?.ok === true && body.rip) {
      return { ok: true, rip: body.rip as Rip, signature };
    }
    return {
      ok: false,
      error: typeof body?.error === 'string' ? body.error : 'Open failed after payment',
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
