/**
 * Future Solana integration scaffold.
 *
 * RIPS LAB is currently demo-only. This module exists so the team can
 * experiment with wallet UI patterns without enabling real transactions.
 *
 * DO NOT wire this to actual transfers, mints, or payments until a full
 * security + legal review is complete.
 */

export type SolanaMode = 'demo' | 'preview' | 'disabled';

export const SOLANA_MODE: SolanaMode = 'disabled';

export function isSolanaPreviewEnabled(): boolean {
  return SOLANA_MODE === 'preview';
}

/** Placeholder — never call a real RPC or sign a transaction from here in the current release. */
export async function getPreviewWalletStatus(): Promise<{
  connected: boolean;
  address: string | null;
  note: string;
}> {
  return {
    connected: false,
    address: null,
    note: 'Solana wallet integration is intentionally disabled in this demo release.',
  };
}
