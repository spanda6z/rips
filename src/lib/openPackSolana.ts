import type { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { supabase } from './supabaseClient';
import { buildPackPaymentTx, getConnection } from './solanaPay';
import { isSolanaConfigured, packPriceSol } from './solanaConfig';
import type { Rip } from '../types';

export type SolOpenResult =
  | { ok: true; rip: Rip; signature: string }
  | { ok: false; error: string };

type SendTx = (
  tx: Transaction,
  connection: Connection,
  options?: { skipPreflight?: boolean; preflightCommitment?: 'processed' | 'confirmed' | 'finalized' },
) => Promise<string>;

/**
 * Pay treasury in SOL, confirm on-chain, then open-pack-sol verifies + rolls.
 */
export async function openPackWithSol(params: {
  packId: string;
  priceSol: number;
  publicKey: PublicKey;
  sendTransaction: SendTx;
  onStatus?: (message: string) => void;
}): Promise<SolOpenResult> {
  const status = (m: string) => params.onStatus?.(m);

  if (!isSolanaConfigured) {
    return { ok: false, error: 'Treasury wallet is not configured (set VITE_TREASURY_WALLET)' };
  }
  if (!supabase) {
    return { ok: false, error: 'Supabase is not configured' };
  }

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { ok: false, error: 'Connect your wallet and wait for your wallet session to finish initializing before purchasing' };
  }

  try {
    const price = packPriceSol(params.packId, params.priceSol);
    status('Building payment…');
    const tx = await buildPackPaymentTx({
      buyer: params.publicKey,
      packId: params.packId,
      priceSol: price,
    });

    const connection = getConnection();
    status('Approve the SOL transfer in your wallet…');
    const signature = await params.sendTransaction(tx, connection, {
      preflightCommitment: 'confirmed',
    });

    status('Confirming on Solana…');
    const blockhash = tx.recentBlockhash;
    const lastValidBlockHeight = tx.lastValidBlockHeight;
    if (!blockhash || typeof lastValidBlockHeight !== 'number') {
      return { ok: false, error: `Could not verify the payment confirmation details. If SOL left your wallet, contact support with signature: ${signature}` };
    }
    const confirmation = await connection.confirmTransaction(
      { signature, blockhash, lastValidBlockHeight },
      'confirmed',
    );
    if (confirmation.value.err) {
      return { ok: false, error: `Solana did not confirm this payment successfully. If SOL left your wallet, contact support with signature: ${signature}` };
    }

    status('Verifying payment and opening pack…');
    const { data, error } = await supabase.functions.invoke('open-pack-sol', {
      body: {
        packId: params.packId,
        signature,
        buyer: params.publicKey.toBase58(),
      },
    });

    if (error) {
      return {
        ok: false,
        error: `${error.message || 'Server failed to verify payment'}. If SOL left your wallet, contact support with signature: ${signature}`,
      };
    }
    const body = data as Record<string, unknown>;
    if (body?.ok === true && body.rip) {
      return { ok: true, rip: body.rip as Rip, signature };
    }
    return {
      ok: false,
      error:
        (typeof body?.error === 'string' ? body.error : 'Open failed after payment') +
        `. Signature: ${signature}`,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/User rejected|rejected the request|cancelled/i.test(msg)) {
      return { ok: false, error: 'Transaction cancelled in wallet' };
    }
    return { ok: false, error: msg };
  }
}
