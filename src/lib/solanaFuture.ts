/**
 * @deprecated v2 uses real Solana payments via solanaConfig / solanaPay / openPackSolana.
 * Kept so old imports do not break; SOLANA_MODE is always live when treasury is set.
 */
import { isSolanaConfigured } from './solanaConfig';

export type SolanaMode = 'live' | 'disabled';

export const SOLANA_MODE: SolanaMode = isSolanaConfigured ? 'live' : 'disabled';

export function isSolanaPreviewEnabled(): boolean {
  return isSolanaConfigured;
}

export async function getPreviewWalletStatus(): Promise<{
  connected: boolean;
  address: string | null;
  note: string;
}> {
  return {
    connected: false,
    address: null,
    note: isSolanaConfigured
      ? 'Use the wallet adapter button to connect.'
      : 'Set VITE_TREASURY_WALLET to enable Solana payments.',
  };
}
